import { Budget, BudgetItem } from '../entities/budget.entity';

export type CreateBudgetInput = {
  workOrderId: number;
  services: BudgetItem[];
  parts: BudgetItem[];
  amount: number;
};

export abstract class BudgetRepository {
  abstract create(input: CreateBudgetInput): Promise<Budget>;
  abstract findLatestByWorkOrderId(workOrderId: number): Promise<Budget | null>;
  abstract markApproved(id: string): Promise<Budget>;
  abstract markVoid(id: string): Promise<Budget>;
}
