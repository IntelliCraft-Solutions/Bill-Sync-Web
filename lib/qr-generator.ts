import QRCode from 'qrcode'

export interface PaymentQRData {
  upiId?: string
  amount: number
  customerName: string
  billNumber: number
  merchantName: string
}

export async function generatePaymentQR(data: PaymentQRData): Promise<string> {
  // Generate UPI payment URL
  let qrData = ''
  
  if (data.upiId) {
    // UPI payment URL format: upi://pay?pa=<UPI_ID>&am=<AMOUNT>&cu=INR&tn=<TRANSACTION_NOTE>
    const transactionNote = `Payment for Bill #${data.billNumber} - ${data.merchantName}`
    qrData = `upi://pay?pa=${encodeURIComponent(data.upiId)}&am=${data.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`
  } else {
    // Fallback: Generate a simple text QR with payment details
    qrData = `Payment Details:\nBill #${data.billNumber}\nAmount: ₹${data.amount.toFixed(2)}\nCustomer: ${data.customerName}\nMerchant: ${data.merchantName}`
  }

  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

