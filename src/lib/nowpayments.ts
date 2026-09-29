import crypto from 'crypto';

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

export function getNowPaymentsApiKey(): string {
  return process.env.NOWPAYMENTS_API_KEY || '';
}

export function getNowPaymentsIpnSecret(): string {
  return process.env.NOWPAYMENTS_IPN_SECRET || '';
}

export async function createNowPaymentsInvoice(params: {
  priceAmount: number;
  priceCurrency?: string;
  payCurrency?: string;
  orderId: string;
  orderDescription: string;
  ipnCallbackUrl: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const apiKey = getNowPaymentsApiKey();

  const body: any = {
    price_amount: params.priceAmount,
    price_currency: params.priceCurrency || 'usd',
    order_id: params.orderId,
    order_description: params.orderDescription,
    ipn_callback_url: params.ipnCallbackUrl,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  };

  if (params.payCurrency) {
    body.pay_currency = params.payCurrency;
  }

  const res = await fetch(`${NOWPAYMENTS_API_URL}/invoice`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to create NOWPayments invoice');
  }

  return data;
}

export async function createNowPaymentsPayment(params: {
  priceAmount: number;
  priceCurrency?: string;
  payCurrency: string;
  orderId: string;
  orderDescription: string;
  ipnCallbackUrl: string;
  customerEmail?: string;
}) {
  const apiKey = getNowPaymentsApiKey();

  const body: any = {
    price_amount: params.priceAmount,
    price_currency: params.priceCurrency || 'usd',
    pay_currency: params.payCurrency.toLowerCase(),
    order_id: params.orderId,
    order_description: params.orderDescription,
    ipn_callback_url: params.ipnCallbackUrl,
    customer_email: params.customerEmail,
  };

  const res = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to create NOWPayments payment');
  }

  return data;
}

export async function getNowPaymentsPaymentStatus(paymentId: string | number) {
  const apiKey = getNowPaymentsApiKey();

  const res = await fetch(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch payment status');
  }

  return data;
}

export async function getAvailableCurrencies(): Promise<string[]> {
  const apiKey = getNowPaymentsApiKey();

  try {
    const res = await fetch(`${NOWPAYMENTS_API_URL}/currencies`, {
      headers: { 'x-api-key': apiKey },
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data.currencies || ['btc', 'eth', 'usdttrc20', 'ltc', 'sol', 'trx', 'doge'];
  } catch {
    return ['btc', 'eth', 'usdttrc20', 'ltc', 'sol', 'trx', 'doge'];
  }
}

export function verifyIpnSignature(bodyObj: any, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const ipnSecret = getNowPaymentsIpnSecret();

  // Sort keys alphabetically
  const sortedKeys = Object.keys(bodyObj).sort();
  const sortedObj: any = {};
  for (const key of sortedKeys) {
    sortedObj[key] = bodyObj[key];
  }

  const hmac = crypto.createHmac('sha512', ipnSecret);
  hmac.update(JSON.stringify(sortedObj));
  const calculatedSig = hmac.digest('hex');

  return calculatedSig === signatureHeader;
}
