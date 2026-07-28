import { SagaEvent } from '../types/saga-event.types';

export const SAGA_EVENT_HANDLER = 'SAGA_EVENT_HANDLER';

export interface SagaEventHandler {
  eventType: string;
  handle(event: SagaEvent): Promise<void>;
}
