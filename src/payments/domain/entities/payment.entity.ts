export enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export class Payment {
  id?: string;
  workOrderId: number;
  budgetId: string;
  amount: number;
  status: PaymentStatus;
  mpPreferenceId?: string;
  mpPaymentId?: string;
  paymentLink?: string;
  failureReason?: string;
  createdAt?: Date;
  confirmedAt?: Date;

  constructor(props: {
    id?: string;
    workOrderId: number;
    budgetId: string;
    amount: number;
    status?: PaymentStatus;
    mpPreferenceId?: string;
    mpPaymentId?: string;
    paymentLink?: string;
    failureReason?: string;
    createdAt?: Date;
    confirmedAt?: Date;
  }) {
    this.id = props.id;
    this.workOrderId = props.workOrderId;
    this.budgetId = props.budgetId;
    this.amount = props.amount;
    this.status = props.status ?? PaymentStatus.PENDING;
    this.mpPreferenceId = props.mpPreferenceId;
    this.mpPaymentId = props.mpPaymentId;
    this.paymentLink = props.paymentLink;
    this.failureReason = props.failureReason;
    this.createdAt = props.createdAt;
    this.confirmedAt = props.confirmedAt;
  }
}
