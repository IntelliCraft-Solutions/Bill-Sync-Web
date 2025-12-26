import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function createOrder(amount: number, currency: string = 'INR', receipt: string) {
  try {
    const options = {
      amount: amount * 100, // amount in the smallest currency unit (paise for INR)
      currency,
      receipt,
    };
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
) {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
  hmac.update(orderId + '|' + paymentId);
  const generatedSignature = hmac.digest('hex');
  return generatedSignature === signature;
}
