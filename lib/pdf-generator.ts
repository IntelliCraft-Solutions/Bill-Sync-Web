import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface BillData {
  billNumber: number
  customerName: string
  createdAt: Date
  totalAmount: number
  paymentStatus?: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  businessName: string
  cashierName: string
  storeDetails?: {
    storeName: string
    address?: string
    phone?: string
    email?: string
    gstNumber?: string
    footerText?: string
  }
}

export function generateBillPDF(bill: BillData) {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 297] // Thermal printer width (80mm)
  })

  let yPos = 10

  // ============ HEADER ============
  const storeName = bill.storeDetails?.storeName || bill.businessName
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(storeName.toUpperCase(), 40, yPos, { align: 'center' })
  yPos += 7

  // Store address and contact
  if (bill.storeDetails) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    
    if (bill.storeDetails.address) {
      const addressLines = doc.splitTextToSize(bill.storeDetails.address, 60)
      addressLines.forEach((line: string) => {
        doc.text(line, 40, yPos, { align: 'center' })
        yPos += 4
      })
    }
    
    if (bill.storeDetails.phone) {
      doc.text(`Tel: ${bill.storeDetails.phone}`, 40, yPos, { align: 'center' })
      yPos += 4
    }
    
    if (bill.storeDetails.email) {
      doc.text(bill.storeDetails.email, 40, yPos, { align: 'center' })
      yPos += 4
    }
    
    if (bill.storeDetails.gstNumber) {
      doc.setFont('helvetica', 'bold')
      doc.text(`GST: ${bill.storeDetails.gstNumber}`, 40, yPos, { align: 'center' })
      yPos += 4
    }
  }

  yPos += 2
  // Decorative line
  doc.setLineWidth(0.5)
  doc.line(10, yPos, 70, yPos)
  yPos += 5

  // Invoice title
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TAX INVOICE', 40, yPos, { align: 'center' })
  yPos += 8

  // ============ BILL DETAILS ============
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  // Bill number and date
  doc.text(`Bill No: ${bill.billNumber}`, 10, yPos)
  yPos += 5
  
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
  doc.text(`Date: ${formattedDate} ${formattedTime}`, 10, yPos)
  yPos += 5
  
  doc.text(`Customer: ${bill.customerName}`, 10, yPos)
  yPos += 7

  // Separator line
  doc.setLineWidth(0.3)
  doc.line(10, yPos, 70, yPos)
  yPos += 5

  // ============ ITEMS TABLE ============
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  
  // Table header
  doc.text('ITEM', 10, yPos)
  doc.text('QTY', 42, yPos, { align: 'center' })
  doc.text('PRICE', 55, yPos, { align: 'right' })
  doc.text('TOTAL', 70, yPos, { align: 'right' })
  yPos += 4

  // Separator
  doc.setLineWidth(0.2)
  doc.line(10, yPos, 70, yPos)
  yPos += 4

  // Table rows
  doc.setFont('helvetica', 'normal')
  bill.items.forEach((item) => {
    // Item name (with wrapping if too long)
    const itemName = item.name.length > 18 ? item.name.substring(0, 18) + '...' : item.name
    doc.text(itemName, 10, yPos)
    doc.text(item.quantity.toString(), 42, yPos, { align: 'center' })
    doc.text(item.unitPrice.toFixed(2), 55, yPos, { align: 'right' })
    doc.text(item.totalPrice.toFixed(2), 70, yPos, { align: 'right' })
    yPos += 5
  })

  yPos += 2

  // Separator line
  doc.setLineWidth(0.3)
  doc.line(10, yPos, 70, yPos)
  yPos += 5

  // ============ TOTALS ============
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  
  // Subtotal
  doc.text('SUBTOTAL:', 10, yPos)
  doc.text(`₹ ${bill.totalAmount.toFixed(2)}`, 70, yPos, { align: 'right' })
  yPos += 6

  // Grand Total (same font size as subtotal)
  doc.setFontSize(9)
  doc.text('GRAND TOTAL:', 10, yPos)
  doc.text(`₹ ${bill.totalAmount.toFixed(2)}`, 70, yPos, { align: 'right' })
  yPos += 8

  // Payment Status Stamp
  if (bill.paymentStatus === 'PAID') {
    yPos += 3
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 128, 0) // Green color
    doc.text('[PAID]', 40, yPos, { align: 'center' })
    doc.setTextColor(0, 0, 0) // Reset to black
    yPos += 5
  }

  // Double line
  doc.setLineWidth(0.5)
  doc.line(10, yPos, 70, yPos)
  yPos += 1
  doc.line(10, yPos, 70, yPos)
  yPos += 8

  // ============ FOOTER ============
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Thank you for your business!', 40, yPos, { align: 'center' })
  yPos += 5
  
  const footerText = bill.storeDetails?.footerText || 'Thank you for shopping!'
  doc.text(footerText, 40, yPos, { align: 'center' })
  yPos += 4
  doc.text('Please visit again', 40, yPos, { align: 'center' })
  yPos += 8

  // QR Code placeholder or barcode
  doc.setFontSize(7)
  doc.text(`Bill ID: ${bill.billNumber}`, 40, yPos, { align: 'center' })
  yPos += 5

  // Terms
  doc.setFontSize(6)
  doc.text('Terms & Conditions:', 10, yPos)
  yPos += 3
  doc.text('1. Goods once sold cannot be returned', 10, yPos)
  yPos += 3
  doc.text('2. Subject to local jurisdiction', 10, yPos)

  return doc
}

export function generateInventoryPDF(products: any[], businessName: string) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text(`${businessName} - Inventory Report`, 105, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' })

  autoTable(doc, {
    startY: 40,
    head: [['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status']],
    body: products.map((product) => [
      product.name,
      product.sku || '-',
      product.category || '-',
      `₹${product.price.toFixed(2)}`,
      product.quantityInStock.toString(),
      product.quantityInStock <= product.lowStockThreshold ? 'Low Stock' : 'In Stock',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [14, 165, 233] },
  })

  return doc
}

export function generateSalesReportPDF(
  data: any,
  businessName: string,
  startDate: string,
  endDate: string
) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text(`${businessName} - Sales Report`, 105, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Period: ${startDate} to ${endDate}`, 105, 30, { align: 'center' })
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 37, { align: 'center' })

  // Summary
  doc.setFontSize(12)
  doc.text('Summary', 20, 50)
  doc.setFontSize(10)
  doc.text(`Total Revenue: ₹${data.totalRevenue.toFixed(2)}`, 20, 58)
  doc.text(`Total Bills: ${data.totalBills}`, 20, 65)
  doc.text(`Average Bill Value: ₹${data.averageBillValue.toFixed(2)}`, 20, 72)

  // Bills table
  if (data.bills && data.bills.length > 0) {
    autoTable(doc, {
      startY: 85,
      head: [['Bill #', 'Date', 'Customer', 'Cashier', 'Amount']],
      body: data.bills.map((bill: any) => [
        bill.billNumber.toString(),
        new Date(bill.createdAt).toLocaleDateString(),
        bill.customerName,
        bill.billingAccount?.username || '-',
        `₹${bill.totalAmount.toFixed(2)}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
    })
  }

  return doc
}
