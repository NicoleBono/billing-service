import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FindPaymentByWorkOrderUseCase } from '../../application/use-cases/find-payment-by-work-order.use-case';
import { HandleMercadoPagoWebhookUseCase } from '../../application/use-cases/handle-mercadopago-webhook.use-case';
import { MercadoPagoWebhookDto } from '../../dto/mercadopago-webhook.dto';

@ApiTags('Pagamentos')
@Controller()
export class PaymentsController {
  constructor(
    private readonly findPaymentByWorkOrder: FindPaymentByWorkOrderUseCase,
    private readonly handleWebhook: HandleMercadoPagoWebhookUseCase,
  ) {}

  @ApiBearerAuth()
  @Get('payments/:workOrderId')
  findByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.findPaymentByWorkOrder.execute(+workOrderId);
  }

  // Rota pública (roteada sem JWT pelo Kong) — chamada pelo Mercado Pago.
  @Post('webhooks/mercadopago')
  @HttpCode(200)
  async mercadoPagoWebhook(@Body() dto: MercadoPagoWebhookDto) {
    const mpPaymentId = dto.data?.id || dto.id;
    if (mpPaymentId && (dto.type === 'payment' || dto.topic === 'payment')) {
      await this.handleWebhook.execute(mpPaymentId);
    }
    return { received: true };
  }
}
