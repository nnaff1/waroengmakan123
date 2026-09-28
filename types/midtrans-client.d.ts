// types/midtrans-client.d.ts
// Type declaration manual untuk package midtrans-client yang tidak memiliki @types

declare module 'midtrans-client' {
  interface MidtransConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  interface ItemDetail {
    id: string;
    name: string;
    price: number;
    quantity: number;
    brand?: string;
    category?: string;
  }

  interface SnapParameter {
    transaction_details: TransactionDetails;
    item_details?: ItemDetail[];
    credit_card?: { secure?: boolean };
    enabled_payments?: string[];
    callbacks?: { finish?: string };
    custom_field1?: string;
    custom_field2?: string;
    custom_field3?: string;
    [key: string]: unknown;
  }

  interface NotificationPayload {
    order_id: string;
    transaction_status: string;
    fraud_status?: string;
    payment_type?: string;
    gross_amount?: string;
    custom_field1?: string;
    custom_field2?: string;
    custom_field3?: string;
    [key: string]: unknown;
  }

  class Snap {
    constructor(config: MidtransConfig);
    createTransaction(parameter: SnapParameter): Promise<{ token: string; redirect_url: string }>;
    createTransactionToken(parameter: SnapParameter): Promise<string>;
    createTransactionRedirectUrl(parameter: SnapParameter): Promise<string>;
  }

  class CoreApi {
    constructor(config: MidtransConfig);
    transaction: {
      notification(body: unknown): Promise<NotificationPayload>;
      status(orderId: string): Promise<NotificationPayload>;
    };
  }

  export { Snap, CoreApi };
}
