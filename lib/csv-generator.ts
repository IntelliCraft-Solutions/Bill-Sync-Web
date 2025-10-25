export function generateInventoryCSV(products: any[]): string {
  const headers = ['Name', 'SKU', 'Category', 'Price', 'Quantity In Stock', 'Low Stock Threshold', 'Status']
  
  const rows = products.map((product) => [
    product.name,
    product.sku || '',
    product.category || '',
    product.price.toFixed(2),
    product.quantityInStock.toString(),
    product.lowStockThreshold.toString(),
    product.quantityInStock <= product.lowStockThreshold ? 'Low Stock' : 'In Stock',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

export function generateSalesCSV(bills: any[]): string {
  const headers = ['Bill Number', 'Date', 'Customer Name', 'Cashier', 'Bill Type', 'Total Amount']
  
  const rows = bills.map((bill) => [
    bill.billNumber.toString(),
    new Date(bill.createdAt).toLocaleString(),
    bill.customerName,
    bill.billingAccount?.username || '',
    bill.billType,
    bill.totalAmount.toFixed(2),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
