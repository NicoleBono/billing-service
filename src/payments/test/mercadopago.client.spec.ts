import { Payment as MercadoPagoPayment, Preference } from 'mercadopago';
import { MercadoPagoClient } from '../infra/mercadopago/mercadopago.client';

jest.mock('mercadopago', () => {
  return {
    MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
    Preference: jest.fn(),
    Payment: jest.fn(),
  };
});

describe('MercadoPagoClient', () => {
  afterEach(() => jest.clearAllMocks());

  it('should create a preference and return its id and payment link', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'pref-1', init_point: 'https://mp/checkout/pref-1' });
    (Preference as unknown as jest.Mock).mockImplementation(() => ({ create }));

    const client = new MercadoPagoClient();
    const result = await client.createPreference(10, 200);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          external_reference: '10',
          items: [expect.objectContaining({ unit_price: 200, id: 'os-10' })],
        }),
      }),
    );
    expect(result).toEqual({ preferenceId: 'pref-1', paymentLink: 'https://mp/checkout/pref-1' });
  });

  it('should fall back to the sandbox init point when init_point is absent', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'pref-2', sandbox_init_point: 'https://mp/sandbox/pref-2' });
    (Preference as unknown as jest.Mock).mockImplementation(() => ({ create }));

    const client = new MercadoPagoClient();
    const result = await client.createPreference(11, 50);

    expect(result.paymentLink).toBe('https://mp/sandbox/pref-2');
  });

  it('should fetch payment details and map the external reference to workOrderId', async () => {
    const get = jest.fn().mockResolvedValue({ status: 'approved', status_detail: 'accredited', external_reference: '10' });
    (MercadoPagoPayment as unknown as jest.Mock).mockImplementation(() => ({ get }));

    const client = new MercadoPagoClient();
    const result = await client.getPaymentDetails('mp-1');

    expect(get).toHaveBeenCalledWith({ id: 'mp-1' });
    expect(result).toEqual({ status: 'approved', statusDetail: 'accredited', workOrderId: 10 });
  });
});
