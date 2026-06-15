import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoConfig, Preference } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly client: MercadoPagoConfig;

  constructor() {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    });
  }

  async createPaymentLink(data: { workOrderId: number; amount: number }) {
    try {
      const preference = new Preference(this.client);
      const response = await preference.create({
        body: {
          items: [
            {
              id: String(data.workOrderId),
              title: `Ordem de Serviço #${data.workOrderId}`,
              quantity: 1,
              unit_price: data.amount,
              currency_id: 'BRL',
            },
          ],
          external_reference: String(data.workOrderId),
          back_urls: {
            success: `${process.env.APP_URL}/billing/webhook/mercadopago`,
            failure: `${process.env.APP_URL}/billing/webhook/mercadopago`,
          },
          auto_return: 'approved',
          notification_url: `${process.env.APP_URL}/billing/webhook/mercadopago`,
        },
      });
      return {
        id: response.id ?? '',
        paymentUrl: response.init_point ?? '',
      };
    } catch (error) {
      this.logger.error('Erro ao criar link de pagamento no Mercado Pago', error);
      throw error;
    }
  }
}
