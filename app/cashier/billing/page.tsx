'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Plus, Trash2, Download, Printer } from 'lucide-react'
import { generateBillPDF } from '@/lib/pdf-generator'
import { generateBillPDFA4 } from '@/lib/pdf-generator-a4'
import { useSession } from 'next-auth/react'

interface Product {
  id: string
  name: string
  price: number
  quantityInStock: number
}

interface BillItem {
  productId?: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export default function BillingPage() {
  const { data: session } = useSession()
  const [billType, setBillType] = useState<'INVENTORY' | 'CUSTOM'>('INVENTORY')
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<BillItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [generatedBill, setGeneratedBill] = useState<any>(null)
  
  // Custom item form
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [customQuantity, setCustomQuantity] = useState('1')

  useEffect(() => {
    if (billType === 'INVENTORY') {
      fetchProducts()
    }
  }, [billType])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/inventory')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const addInventoryItem = (product: Product) => {
    const existing = items.find(item => item.productId === product.id)
    if (existing) {
      setItems(items.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ))
    } else {
      setItems([...items, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price,
      }])
    }
  }

  const addCustomItem = () => {
    if (!customName || !customPrice || !customQuantity) return
    
    const quantity = parseInt(customQuantity)
    const unitPrice = parseFloat(customPrice)
    
    setItems([...items, {
      name: customName,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
    }])
    
    setCustomName('')
    setCustomPrice('')
    setCustomQuantity('1')
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return
    setItems(items.map((item, i) =>
      i === index
        ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
        : item
    ))
  }

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const handleSubmit = async () => {
    if (!customerName || items.length === 0) {
      return // Validation will be shown in UI
    }

    setLoading(true)

    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          billType,
          items,
          totalAmount: getTotalAmount(),
        }),
      })

      if (response.ok) {
        const bill = await response.json()
        
        // Store bill data for modal
        const billData = {
          ...bill,
          businessName: session?.user?.name || 'Your Business',
          cashierName: session?.user?.name || 'Cashier'
        }
        
        setGeneratedBill(billData)
        setShowSuccessModal(true)
        
        // Reset form
        setItems([])
        setCustomerName('')
      }
    } catch (error) {
      console.error('Failed to create bill:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!generatedBill) return
    
    const doc = printFormat === 'thermal' 
      ? generateBillPDF(generatedBill)
      : generateBillPDFA4(generatedBill)
    
    doc.save(`Bill-${generatedBill.billNumber}.pdf`)
  }

  const handlePrintPDF = () => {
    if (!generatedBill) return
    
    const doc = printFormat === 'thermal' 
      ? generateBillPDF(generatedBill)
      : generateBillPDFA4(generatedBill)
    
    // Open in new window for printing
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    const printWindow = window.open(pdfUrl)
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const closeModal = () => {
    setShowSuccessModal(false)
    setGeneratedBill(null)
  }

  return (
    <DashboardLayout role="CASHIER">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Bill</h1>

        {/* Bill Type Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">Bill Type</label>
          <div className="flex gap-4">
            <button
              onClick={() => setBillType('INVENTORY')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                billType === 'INVENTORY'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inventory Bill
            </button>
            <button
              onClick={() => setBillType('CUSTOM')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                billType === 'CUSTOM'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom Bill
            </button>
          </div>
        </div>

        {/* Customer Name and Print Format */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Printer className="w-4 h-4 inline mr-2" />
                Print Format
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPrintFormat('thermal')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    printFormat === 'thermal'
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Thermal (80mm)
                </button>
                <button
                  onClick={() => setPrintFormat('a4')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    printFormat === 'a4'
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  A4 Paper
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Items */}
        {billType === 'INVENTORY' ? (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addInventoryItem(product)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                >
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">₹{product.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">Stock: {product.quantityInStock}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Custom Item</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Item name"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="number"
                step="0.01"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Price"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="number"
                value={customQuantity}
                onChange={(e) => setCustomQuantity(e.target.value)}
                placeholder="Quantity"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={addCustomItem}
                className="flex items-center justify-center gap-2 bg-primary-500 text-white px-4 py-3 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Item
              </button>
            </div>
          </div>
        )}

        {/* Bill Items */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bill Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        ₹{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          min="1"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        ₹{item.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-900">
                      Total Amount:
                    </td>
                    <td colSpan={2} className="px-6 py-4 font-bold text-xl text-gray-900">
                      ₹{getTotalAmount().toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {items.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={loading || !customerName}
            className="w-full bg-primary-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Bill...' : 'Generate Bill'}
          </button>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && generatedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Bill Created Successfully!
              </h3>
              
              {/* Bill Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-600">Bill Number</p>
                <p className="text-lg font-semibold text-gray-900">#{generatedBill.billNumber}</p>
                <p className="text-sm text-gray-600 mt-2">Customer</p>
                <p className="text-lg font-semibold text-gray-900">{generatedBill.customerName}</p>
                <p className="text-sm text-gray-600 mt-2">Total Amount</p>
                <p className="text-2xl font-bold text-primary-600">₹{generatedBill.totalAmount.toFixed(2)}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handlePrintPDF}
                  className="w-full flex items-center justify-center gap-2 bg-primary-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  Print Bill
                </button>
                
                <button
                  onClick={handleDownloadPDF}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>

                <button
                  onClick={closeModal}
                  className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
