import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Payment as MercadoPagoPayment, Preference } from 'mercadopago';

export type MercadoPagoPreferenceResult = {
  preferenceId: string;
  paymentLink: string;
};

export type MercadoPagoPaymentStatus = 'approved' | 'rejected' | 'pending' | 'in_process' | 'cancelled' | 'refunded';

export type MercadoPagoPaymentDetails = {
  status: MercadoPagoPaymentStatus;
  statusDetail?: string;
  workOrderId: number;
};

@Injectable()
export class MercadoPagoClient {
  private readonly config = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-INVALID-TOKEN',
  });

  async createPreference(workOrderId: number, amount: number): Promise<MercadoPagoPreferenceResult> {
    const preference = new Preference(this.config);

    const result = await preference.create({
      body: {
        items: [
          {
            id: `os-${workOrderId}`,
            title: `Ordem de Serviço #${workOrderId}`,
            quantity: 1,
            unit_price: amount,
          },
        ],
        external_reference: String(workOrderId),
        notification_url: process.env.MP_WEBHOOK_URL,
      },
    });

    return {
      preferenceId: result.id as string,
      paymentLink: (result.init_point || result.sandbox_init_point) as string,
    };
  }

  async getPaymentDetails(mpPaymentId: string): Promise<MercadoPagoPaymentDetails> {
    const paymentApi = new MercadoPagoPayment(this.config);
    const result = await paymentApi.get({ id: mpPaymentId });

    return {
      status: result.status as MercadoPagoPaymentStatus,
      statusDetail: result.status_detail,
      workOrderId: Number(result.external_reference),
    };
  }
}
