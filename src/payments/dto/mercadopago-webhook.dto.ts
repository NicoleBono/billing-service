import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// Payload do webhook do Mercado Pago (formato "topic/id" ou o formato novo
// { type, data: { id } }) — aceitamos ambos e extraímos o id do pagamento.
export class MercadoPagoWebhookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  data?: { id: string };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;
}
