import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FindBudgetByWorkOrderUseCase } from '../../application/use-cases/find-budget-by-work-order.use-case';

@ApiTags('Orçamentos')
@ApiBearerAuth()
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly findBudgetByWorkOrder: FindBudgetByWorkOrderUseCase) {}

  @Get(':workOrderId')
  findByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.findBudgetByWorkOrder.execute(+workOrderId);
  }
}
