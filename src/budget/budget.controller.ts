import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BudgetService } from './budget.service';

@ApiTags('Orçamentos')
@Controller('billing')
export class BudgetController {
  constructor(private readonly service: BudgetService) {}

  @Get(':workOrderId')
  findOne(@Param('workOrderId') workOrderId: string) {
    return this.service.findByWorkOrder(+workOrderId);
  }

  @Post('webhook/mercadopago')
  async webhook(@Body() body: { data: { id: string }; type: string }) {
    if (body.type === 'payment') {
      await this.service.handleWebhook(body.data.id, 'approved');
    }
    return { ok: true };
  }
}
