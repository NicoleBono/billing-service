import { SagaEventType } from '../types/saga-event.types';

export const SAGA_EVENT_HANDLER = 'SAGA_EVENT_HANDLER';

export interface SagaEventHandler<TPayload = Record<string, unknown>> {
  readonly eventType: SagaEventType;
  handle(workOrderId: number, payload: TPayload): Promise<void>;
}
