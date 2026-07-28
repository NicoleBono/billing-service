import { defineFeature, loadFeature } from 'jest-cucumber';
import { CreateBudgetUseCase } from '../../../src/budgets/application/use-cases/create-budget.use-case';
import { ApproveBudgetUseCase } from '../../../src/budgets/application/use-cases/approve-budget.use-case';
import { VoidBudgetUseCase } from '../../../src/budgets/application/use-cases/void-budget.use-case';
import { CreatePaymentUseCase } from '../../../src/payments/application/use-cases/create-payment.use-case';
import { HandleMercadoPagoWebhookUseCase } from '../../../src/payments/application/use-cases/handle-mercadopago-webhook.use-case';
import { BudgetRepository } from '../../../src/budgets/domain/repositories/budget.repository';
import { Budget, BudgetItem, BudgetStatus } from '../../../src/budgets/domain/entities/budget.entity';
import { PaymentRepository } from '../../../src/payments/domain/repositories/payment.repository';
import { Payment, PaymentStatus } from '../../../src/payments/domain/entities/payment.entity';

class InMemoryBudgetRepository extends BudgetRepository {
  private items: Budget[] = [];
  private seq = 1;

  async create(input: { workOrderId: number; services: BudgetItem[]; parts: BudgetItem[]; amount: number }) {
    const budget = new Budget({ id: String(this.seq++), ...input });
    this.items.push(budget);
    return budget;
  }

  async findLatestByWorkOrderId(workOrderId: number) {
    const found = this.items.filter((b) => b.workOrderId === workOrderId);
    return found.length ? found[found.length - 1] : null;
  }

  async markApproved(id: string) {
    const budget = this.items.find((b) => b.id === id)!;
    budget.status = BudgetStatus.APPROVED;
    return budget;
  }

  async markVoid(id: string) {
    const budget = this.items.find((b) => b.id === id)!;
    budget.status = BudgetStatus.VOID;
    return budget;
  }
}

class InMemoryPaymentRepository extends PaymentRepository {
  private items: Payment[] = [];
  private seq = 1;

  async create(input: { workOrderId: number; budgetId: string; amount: number; mpPreferenceId: string; paymentLink: string }) {
    const payment = new Payment({ id: String(this.seq++), ...input });
    this.items.push(payment);
    return payment;
  }

  async findLatestByWorkOrderId(workOrderId: number) {
    const found = this.items.filter((p) => p.workOrderId === workOrderId);
    return found.length ? found[found.length - 1] : null;
  }

  async findByMpPaymentId(mpPaymentId: string) {
    return this.items.find((p) => p.mpPaymentId === mpPaymentId) ?? null;
  }

  async linkMpPaymentId(id: string, mpPaymentId: string) {
    const payment = this.items.find((p) => p.id === id)!;
    payment.mpPaymentId = mpPaymentId;
    return payment;
  }

  async markConfirmed(id: string) {
    const payment = this.items.find((p) => p.id === id)!;
    payment.status = PaymentStatus.CONFIRMED;
    payment.confirmedAt = new Date();
    return payment;
  }

  async markFailed(id: string, reason: string) {
    const payment = this.items.find((p) => p.id === id)!;
    payment.status = PaymentStatus.FAILED;
    payment.failureReason = reason;
    return payment;
  }
}

const feature = loadFeature('./test/bdd/features/budget-approval.feature');

defineFeature(feature, (test) => {
  let budgetRepository: InMemoryBudgetRepository;
  let paymentRepository: InMemoryPaymentRepository;
  let sagaPublisher: { publish: jest.Mock };
  let mercadoPago: { createPreference: jest.Mock; getPaymentDetails: jest.Mock };
  let createBudget: CreateBudgetUseCase;
  let approveBudget: ApproveBudgetUseCase;
  let voidBudget: VoidBudgetUseCase;
  let createPayment: CreatePaymentUseCase;
  let handleWebhook: HandleMercadoPagoWebhookUseCase;

  let workOrderId: number;
  let totalAmount: number;

  beforeEach(() => {
    budgetRepository = new InMemoryBudgetRepository();
    paymentRepository = new InMemoryPaymentRepository();
    sagaPublisher = { publish: jest.fn() };
    mercadoPago = {
      createPreference: jest.fn().mockResolvedValue({ preferenceId: 'pref-1', paymentLink: 'https://mp.example/pay/1' }),
      getPaymentDetails: jest.fn(),
    };

    createBudget = new CreateBudgetUseCase(budgetRepository, sagaPublisher as any);
    approveBudget = new ApproveBudgetUseCase(budgetRepository);
    voidBudget = new VoidBudgetUseCase(budgetRepository);
    createPayment = new CreatePaymentUseCase(paymentRepository, mercadoPago as any);
    handleWebhook = new HandleMercadoPagoWebhookUseCase(paymentRepository, mercadoPago as any, sagaPublisher as any);
  });

  test('Cliente aprova o orçamento e o pagamento é confirmado', ({ given, when, then, and }) => {
    given(/^uma ordem de serviço "(.*)" foi criada com valor total de (.*)$/, (id: string, amount: string) => {
      workOrderId = Number(id);
      totalAmount = Number(amount);
    });

    when('o Billing Service recebe o evento OS_CREATED', async () => {
      await createBudget.execute({ workOrderId, services: [], parts: [], amount: totalAmount });
    });

    then(/^um orçamento pendente é criado para a ordem de serviço "(.*)"$/, async (id: string) => {
      const budget = await budgetRepository.findLatestByWorkOrderId(Number(id));
      expect(budget?.status).toBe(BudgetStatus.PENDING);
      expect(budget?.amount).toBe(totalAmount);
    });

    when(/^o cliente aprova o orçamento da ordem de serviço "(.*)"$/, async () => {
      const approved = await approveBudget.execute(workOrderId);
      await createPayment.execute({ workOrderId, budgetId: approved.id as string, amount: approved.amount });
    });

    then('o orçamento é marcado como aprovado', async () => {
      const budget = await budgetRepository.findLatestByWorkOrderId(workOrderId);
      expect(budget?.status).toBe(BudgetStatus.APPROVED);
    });

    and('uma cobrança é criada no Mercado Pago', async () => {
      expect(mercadoPago.createPreference).toHaveBeenCalledWith(workOrderId, totalAmount);
      const payment = await paymentRepository.findLatestByWorkOrderId(workOrderId);
      expect(payment?.status).toBe(PaymentStatus.PENDING);
      expect(payment?.paymentLink).toBe('https://mp.example/pay/1');
    });

    when('o Mercado Pago confirma o pagamento', async () => {
      mercadoPago.getPaymentDetails.mockResolvedValue({ status: 'approved', workOrderId });
      await handleWebhook.execute('mp-payment-1');
    });

    then('o pagamento é marcado como confirmado', async () => {
      const payment = await paymentRepository.findLatestByWorkOrderId(workOrderId);
      expect(payment?.status).toBe(PaymentStatus.CONFIRMED);
      expect(payment?.mpPaymentId).toBe('mp-payment-1');
    });

    and(/^o evento PAYMENT_CONFIRMED é publicado para a ordem de serviço "(.*)"$/, (id: string) => {
      expect(sagaPublisher.publish).toHaveBeenCalledWith('PAYMENT_CONFIRMED', Number(id), {});
    });
  });

  test('Cliente rejeita o orçamento', ({ given, when, then, and }) => {
    given(/^uma ordem de serviço "(.*)" foi criada com valor total de (.*)$/, (id: string, amount: string) => {
      workOrderId = Number(id);
      totalAmount = Number(amount);
    });

    when('o Billing Service recebe o evento OS_CREATED', async () => {
      await createBudget.execute({ workOrderId, services: [], parts: [], amount: totalAmount });
    });

    then(/^um orçamento pendente é criado para a ordem de serviço "(.*)"$/, async (id: string) => {
      const budget = await budgetRepository.findLatestByWorkOrderId(Number(id));
      expect(budget?.status).toBe(BudgetStatus.PENDING);
    });

    when(/^o cliente rejeita o orçamento da ordem de serviço "(.*)"$/, async () => {
      await voidBudget.execute(workOrderId);
    });

    then('o orçamento é marcado como anulado', async () => {
      const budget = await budgetRepository.findLatestByWorkOrderId(workOrderId);
      expect(budget?.status).toBe(BudgetStatus.VOID);
    });

    and('nenhuma cobrança é criada no Mercado Pago', () => {
      expect(mercadoPago.createPreference).not.toHaveBeenCalled();
    });
  });
});
