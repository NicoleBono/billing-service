export enum BudgetStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  VOID = 'VOID',
}

export interface BudgetItem {
  serviceId?: number;
  partId?: number;
  quantity: number;
}

export class Budget {
  id?: string;
  workOrderId: number;
  services: BudgetItem[];
  parts: BudgetItem[];
  amount: number;
  status: BudgetStatus;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: {
    id?: string;
    workOrderId: number;
    services: BudgetItem[];
    parts: BudgetItem[];
    amount: number;
    status?: BudgetStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    if (props.amount < 0) {
      throw new Error('Valor do orçamento não pode ser negativo');
    }

    this.id = props.id;
    this.workOrderId = props.workOrderId;
    this.services = props.services;
    this.parts = props.parts;
    this.amount = props.amount;
    this.status = props.status ?? BudgetStatus.PENDING;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
