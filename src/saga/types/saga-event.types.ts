// Catálogo de eventos da Saga (OS Service ↔ Billing Service ↔ Execution
// Service). Ver ADR-004/ADR-005 no repositório challenge-oficina (OS
// Service, orquestrador) para o desenho completo do fluxo.
//
// Este serviço consome: OS_CREATED, BUDGET_APPROVAL_DECIDED, ADDITIONAL_REQUESTED
// Este serviço publica: BUDGET_GENERATED, PAYMENT_CONFIRMED, PAYMENT_FAILED

export enum SagaEventType {
  OS_CREATED = 'OS_CREATED',
  BUDGET_APPROVAL_DECIDED = 'BUDGET_APPROVAL_DECIDED',
  ADDITIONAL_REQUESTED = 'ADDITIONAL_REQUESTED',
  EXECUTION_REQUESTED = 'EXECUTION_REQUESTED',

  BUDGET_GENERATED = 'BUDGET_GENERATED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  EXECUTION_COMPLETED = 'EXECUTION_COMPLETED',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
}

export interface SagaEvent<TPayload = Record<string, unknown>> {
  eventType: SagaEventType;
  workOrderId: number;
  payload: TPayload;
  occurredAt: string;
}

export interface WorkOrderItem {
  serviceId?: number;
  partId?: number;
  quantity: number;
}

export interface OsCreatedPayload {
  customer: { name: string; document: string; email: string; phone: string };
  totalAmount: number;
  services: { serviceId: number; quantity: number }[];
  parts: { partId: number; quantity: number }[];
}

export interface BudgetApprovalDecidedPayload {
  approved: boolean;
}

export interface AdditionalRequestedPayload {
  services: { serviceId: number; quantity: number }[];
  parts: { partId: number; quantity: number }[];
}
