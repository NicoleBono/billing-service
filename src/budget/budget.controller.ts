import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BudgetService } from './budget.service';

@ApiTags('Orçamentos')
@Controller('billing')
export class BudgetController {
  constructor(private readonly service: BudgetService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
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
