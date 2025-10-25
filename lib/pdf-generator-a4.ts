import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface BillData {
  billNumber: number
  customerName: string
  createdAt: Date
  totalAmount: number
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  businessName: string
  cashierName: string
  businessAddress?: string
  businessPhone?: string
  businessEmail?: string
  businessGSTIN?: string
}

export function generateBillPDFA4(bill: BillData) {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  // ============ HEADER WITH BORDER ============
  // Outer border
  doc.setLineWidth(0.5)
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

  // Company header box
  doc.setFillColor(14, 165, 233) // Primary blue
  doc.rect(15, 15, pageWidth - 30, 35, 'F')

  // Business name
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(bill.businessName.toUpperCase(), pageWidth / 2, 28, { align: 'center' })

  // Business details (if provided)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  if (bill.businessAddress || bill.businessPhone || bill.businessEmail) {
    let detailsY = 36
    if (bill.businessAddress) {
      doc.text(bill.businessAddress, pageWidth / 2, detailsY, { align: 'center' })
      detailsY += 4
    }
    if (bill.businessPhone || bill.businessEmail) {
      const contact = [bill.businessPhone, bill.businessEmail].filter(Boolean).join(' | ')
      doc.text(contact, pageWidth / 2, detailsY, { align: 'center' })
      detailsY += 4
    }
    if (bill.businessGSTIN) {
      doc.text(`GSTIN: ${bill.businessGSTIN}`, pageWidth / 2, detailsY, { align: 'center' })
    }
  }

  yPos = 60

  // ============ INVOICE TITLE ============
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('TAX INVOICE', pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  // ============ BILL DETAILS IN TWO COLUMNS ============
  // Left column
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  yPos += 6
  doc.text(bill.customerName, 20, yPos)
  yPos += 10

  // Right column - Bill details
  const rightColX = pageWidth - 80
  let rightYPos = yPos - 16

  doc.setFont('helvetica', 'bold')
  doc.text('Invoice No:', rightColX, rightYPos)
  doc.setFont('helvetica', 'normal')
  doc.text(`#${bill.billNumber}`, rightColX + 30, rightYPos)
  rightYPos += 6

  const date = new Date(bill.createdAt)
  const formattedDate = date.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })
  const formattedTime = date.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })

  doc.setFont('helvetica', 'bold')
  doc.text('Date:', rightColX, rightYPos)
  doc.setFont('helvetica', 'normal')
  doc.text(formattedDate, rightColX + 30, rightYPos)
  rightYPos += 6

  doc.setFont('helvetica', 'bold')
  doc.text('Time:', rightColX, rightYPos)
  doc.setFont('helvetica', 'normal')
  doc.text(formattedTime, rightColX + 30, rightYPos)
  rightYPos += 6

  doc.setFont('helvetica', 'bold')
  doc.text('Cashier:', rightColX, rightYPos)
  doc.setFont('helvetica', 'normal')
  doc.text(bill.cashierName, rightColX + 30, rightYPos)

  yPos += 10

  // ============ ITEMS TABLE ============
  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Amount']],
    body: bill.items.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.quantity.toString(),
      `₹${item.unitPrice.toFixed(2)}`,
      `₹${item.totalPrice.toFixed(2)}`,
    ]),
    theme: 'grid',
    headStyles: { 
      fillColor: [14, 165, 233],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: 15, right: 15 }
  })

  // Get the final Y position after the table
  yPos = (doc as any).lastAutoTable.finalY + 10

  // ============ TOTALS SECTION ============
  const totalsX = pageWidth - 80
  
  // Subtotal
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal:', totalsX, yPos)
  doc.text(`₹${bill.totalAmount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' })
  yPos += 6

  // Tax (commented out - can be enabled)
  // const taxRate = 0.18 // 18% GST
  // const taxAmount = bill.totalAmount * taxRate
  // doc.text(`GST (${(taxRate * 100).toFixed(0)}%):`, totalsX, yPos)
  // doc.text(`₹${taxAmount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' })
  // yPos += 6

  // Discount (if applicable)
  // doc.text('Discount:', totalsX, yPos)
  // doc.text('₹0.00', pageWidth - 20, yPos, { align: 'right' })
  // yPos += 8

  yPos += 2

  // Grand Total with background
  doc.setFillColor(240, 240, 240)
  doc.rect(totalsX - 5, yPos - 5, pageWidth - totalsX - 10, 10, 'F')
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('GRAND TOTAL:', totalsX, yPos)
  doc.text(`₹${bill.totalAmount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' })

  // ============ AMOUNT IN WORDS ============
  yPos += 15
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Amount in Words:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  const amountInWords = numberToWords(bill.totalAmount)
  doc.text(`${amountInWords} Rupees Only`, 20, yPos + 5)

  // ============ FOOTER ============
  const footerY = pageHeight - 40

  // Terms and conditions
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Terms & Conditions:', 20, footerY)
  doc.setFont('helvetica', 'normal')
  doc.text('1. Goods once sold will not be taken back or exchanged', 20, footerY + 4)
  doc.text('2. All disputes are subject to local jurisdiction only', 20, footerY + 8)
  doc.text('3. Payment should be made within 7 days of invoice date', 20, footerY + 12)

  // Signature section
  const signatureY = footerY + 5
  doc.setFont('helvetica', 'bold')
  doc.text('Authorized Signature', pageWidth - 60, signatureY + 15, { align: 'center' })
  doc.setLineWidth(0.3)
  doc.line(pageWidth - 80, signatureY + 12, pageWidth - 40, signatureY + 12)

  // Thank you message
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bolditalic')
  doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 15, { align: 'center' })

  return doc
}

// Helper function to convert number to words (Indian system)
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

  if (num === 0) return 'Zero'

  const crores = Math.floor(num / 10000000)
  num %= 10000000
  const lakhs = Math.floor(num / 100000)
  num %= 100000
  const thousands = Math.floor(num / 1000)
  num %= 1000
  const hundreds = Math.floor(num / 100)
  num %= 100
  const tensPlace = Math.floor(num / 10)
  const onesPlace = num % 10

  let words = ''

  if (crores > 0) {
    words += convertTwoDigit(crores) + ' Crore '
  }
  if (lakhs > 0) {
    words += convertTwoDigit(lakhs) + ' Lakh '
  }
  if (thousands > 0) {
    words += convertTwoDigit(thousands) + ' Thousand '
  }
  if (hundreds > 0) {
    words += ones[hundreds] + ' Hundred '
  }
  if (tensPlace === 1) {
    words += teens[onesPlace] + ' '
  } else {
    if (tensPlace > 0) {
      words += tens[tensPlace] + ' '
    }
    if (onesPlace > 0) {
      words += ones[onesPlace] + ' '
    }
  }

  return words.trim()
}

function convertTwoDigit(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

  if (num < 10) return ones[num]
  if (num >= 10 && num < 20) return teens[num - 10]
  
  const tensPlace = Math.floor(num / 10)
  const onesPlace = num % 10
  
  return (tens[tensPlace] + (onesPlace > 0 ? ' ' + ones[onesPlace] : '')).trim()
}
