'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Plus, Trash2, Download, Printer, Package } from 'lucide-react'
import { generateBillPDF } from '@/lib/pdf-generator'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useToast } from '@/components/ToastProvider'
import { generatePaymentQR } from '@/lib/qr-generator'

interface Product {
  id: string
  name: string
  price: number
  quantityInStock: number
  imageUrl?: string
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
  const { showError, showSuccess } = useToast()
  const [billType, setBillType] = useState<'INVENTORY' | 'CUSTOM'>('INVENTORY')
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<BillItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [generatedBill, setGeneratedBill] = useState<any>(null)
  const [storeDetails, setStoreDetails] = useState<any>(null)
  const [paymentQRCode, setPaymentQRCode] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'CASH' | 'ONLINE' | null>(null)
  const [showPaymentStep, setShowPaymentStep] = useState(false)
  
  // Custom item form
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [customQuantity, setCustomQuantity] = useState('1')

  useEffect(() => {
    if (billType === 'INVENTORY') {
      fetchProducts()
    }
  }, [billType])

  useEffect(() => {
    fetchStoreDetails()
  }, [])

  const fetchStoreDetails = async () => {
    try {
      const response = await fetch('/api/store-info')
      if (response.ok) {
        const data = await response.json()
        setStoreDetails(data.storeDetails)
        console.log('Store details fetched:', data.storeDetails)
      } else {
        console.error('Failed to fetch store details:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch store details:', error)
    }
  }

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

  const validateStoreDetails = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/store-details/validate')
      const data = await response.json()
      
      if (!data.isValid) {
        showError(data.message || 'Please ask the owner to fill all business details first.')
        return false
      }
      return true
    } catch (error) {
      console.error('Failed to validate store details:', error)
      showError('Failed to validate store details. Please try again.')
      return false
    }
  }

  const handleSubmit = async () => {
    if (!customerName || items.length === 0) {
      return // Validation will be shown in UI
    }

    // Validate store details before creating bill
    const isValid = await validateStoreDetails()
    if (!isValid) {
      return
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
        
        // Store bill data for modal with store details
        const billData = {
          ...bill,
          businessName: storeDetails?.storeName || 'Your Business',
          storeDetails: storeDetails,
          paymentStatus: bill.paymentStatus || 'PENDING'
        }
        
        console.log('Bill data being saved:', billData)
        console.log('Store details:', storeDetails)
        
        setGeneratedBill(billData)
        
        // Generate QR code if payment details exist
        if (storeDetails?.upiId || storeDetails?.qrCodeImage) {
          try {
            if (storeDetails.qrCodeImage) {
              // Use uploaded QR code image
              setPaymentQRCode(storeDetails.qrCodeImage)
            } else if (storeDetails.upiId) {
              // Generate QR code from UPI ID
              const qrCode = await generatePaymentQR({
                upiId: storeDetails.upiId,
                amount: bill.totalAmount,
                customerName: bill.customerName,
                billNumber: bill.billNumber,
                merchantName: storeDetails.storeName || 'Your Business'
              })
              setPaymentQRCode(qrCode)
            }
          } catch (error) {
            console.error('Failed to generate QR code:', error)
          }
        }
        
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

  const handleDownloadPDF = async () => {
    if (!generatedBill) return
    
    // Validate store details before download
    const isValid = await validateStoreDetails()
    if (!isValid) {
      return
    }
    
    // Prepare bill data with payment status
    const billDataForPDF = {
      ...generatedBill,
      paymentStatus: generatedBill.paymentStatus || 'PENDING'
    }
    
    const doc = generateBillPDF(billDataForPDF)
    doc.save(`Bill-${generatedBill.billNumber}.pdf`)
  }

  const handlePrintPDF = async () => {
    if (!generatedBill) return
    
    // Validate store details before print
    const isValid = await validateStoreDetails()
    if (!isValid) {
      return
    }
    
    // Prepare bill data with payment status
    const billDataForPDF = {
      ...generatedBill,
      paymentStatus: generatedBill.paymentStatus || 'PENDING'
    }
    
    const doc = generateBillPDF(billDataForPDF)
    
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
    setPaymentQRCode(null)
    setSelectedPaymentMethod(null)
    setShowPaymentStep(false)
  }

  const handlePaymentMethodSelect = async (method: 'CASH' | 'ONLINE') => {
    setSelectedPaymentMethod(method)
    if (method === 'ONLINE') {
      // If ONLINE and QR code available, show payment step
      if (paymentQRCode) {
        setShowPaymentStep(true)
      } else {
        // If no QR code available, show error and don't proceed
        showError('Online payment not configured. Please contact admin.')
        setSelectedPaymentMethod(null)
      }
    } else {
      // If CASH, mark as paid immediately and proceed to action buttons
      setShowPaymentStep(false)
      try {
        const response = await fetch('/api/billing/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            billId: generatedBill.id,
            paymentMethod: 'CASH',
          }),
        })
        if (response.ok) {
          setGeneratedBill({ ...generatedBill, paymentMethod: 'CASH', paymentStatus: 'PAID' })
        }
      } catch (error) {
        console.error('Failed to update payment method:', error)
      }
    }
  }

  const handleMarkAsPaid = async () => {
    try {
      const response = await fetch('/api/billing/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: generatedBill.id,
          paymentMethod: 'ONLINE',
        }),
      })
      if (response.ok) {
        showSuccess('Payment marked as received!')
        // Update bill status
        setGeneratedBill({ ...generatedBill, paymentStatus: 'PAID' })
        // Close payment step and show action buttons
        setShowPaymentStep(false)
      } else {
        showError('Failed to update payment status')
      }
    } catch (error) {
      showError('Failed to update payment status')
    }
  }

  return (
    <DashboardLayout role="CASHIER">
      <div className="space-y-4 sm:space-y-6 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Bill</h1>

        {/* Bill Type Selection */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
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

        {/* Customer Name */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter customer name"
          />
        </div>

        {/* Add Items */}
        {billType === 'INVENTORY' ? (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addInventoryItem(product)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 active:bg-primary-100 transition-all text-left touch-manipulation min-h-[100px] sm:min-h-[auto]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {product.imageUrl ? (
                      <div className="relative h-20 w-20 sm:h-16 sm:w-16 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-20 w-20 sm:h-16 sm:w-16 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                        <Package className="h-10 w-10 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                      <p className="text-base sm:text-sm font-semibold text-primary-600 mt-1">₹{product.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-1">Stock: {product.quantityInStock}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Custom Item</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                className="flex items-center justify-center gap-2 bg-primary-500 text-white px-4 py-3 rounded-lg hover:bg-primary-600 transition-colors min-h-[48px] touch-manipulation"
              >
                <Plus className="w-5 h-5" />
                <span className="whitespace-nowrap">Add Item</span>
              </button>
            </div>
          </div>
        )}

        {/* Bill Items */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bill Items</h2>
            </div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {items.map((item, index) => (
                <div key={index} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                        <span>₹{item.unitPrice.toFixed(2)}</span>
                        <span>•</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Quantity:</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center"
                      min="1"
                    />
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="font-bold text-lg text-gray-900">₹{item.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-gray-50 border-t-2 border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Amount:</span>
                  <span className="font-bold text-xl text-gray-900">₹{getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {items.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={loading || !customerName}
            className="w-full bg-primary-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[56px] touch-manipulation shadow-lg"
          >
            {loading ? 'Creating Bill...' : 'Generate Bill'}
          </button>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && generatedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-[500px] p-6 sm:p-8 shadow-2xl">
            {/* Step 1: Payment Method Selection (if not selected yet) */}
            {!selectedPaymentMethod && !showPaymentStep && (
              <>
                {/* Success Icon and Title */}
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-3">
                    <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Bill Created Successfully!
                  </h3>
                </div>

                {/* Bill Details */}
                <div className="bg-gray-50 rounded-lg p-5 mb-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Bill Number</p>
                      <p className="text-lg font-semibold text-gray-900">#{generatedBill.billNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Customer</p>
                      <p className="text-lg font-semibold text-gray-900">{generatedBill.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-primary-600">₹{generatedBill.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3 text-center">Select Payment Method</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handlePaymentMethodSelect('CASH')}
                      className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
                    >
                      <div className="text-2xl mb-2">💵</div>
                      <span className="text-sm font-semibold text-gray-700">CASH</span>
                    </button>
                    <button
                      onClick={() => handlePaymentMethodSelect('ONLINE')}
                      disabled={!paymentQRCode}
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${
                        paymentQRCode
                          ? 'border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                          : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-2xl mb-2">📱</div>
                      <span className="text-sm font-semibold text-gray-700">ONLINE</span>
                    </button>
                  </div>
                  {!paymentQRCode && (
                    <p className="text-xs text-gray-500 text-center mt-2">Online payment not available</p>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={closeModal}
                  className="w-full py-2.5 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </>
            )}

            {/* Step 2: Online Payment (QR Code) */}
            {showPaymentStep && selectedPaymentMethod === 'ONLINE' && paymentQRCode && (
              <>
                {/* Back Button */}
                <button
                  onClick={() => {
                    setShowPaymentStep(false)
                    setSelectedPaymentMethod(null)
                  }}
                  className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                {/* QR Code Section */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Scan to Pay Online</h3>
                  <div className="flex justify-center mb-3">
                    <div className="relative w-64 h-64 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                      <Image
                        src={paymentQRCode}
                        alt="Payment QR Code"
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Amount: <span className="font-semibold text-gray-900">₹{generatedBill.totalAmount.toFixed(2)}</span>
                  </p>
                  
                  {generatedBill.paymentStatus !== 'PAID' && (
                    <button
                      onClick={handleMarkAsPaid}
                      className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                      ✓ Mark as Paid
                    </button>
                  )}
                  {generatedBill.paymentStatus === 'PAID' && (
                    <div className="w-full px-4 py-3 bg-green-100 text-green-700 rounded-lg font-medium text-center">
                      ✓ Payment Received
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handlePrintPDF}
                    className="flex items-center justify-center gap-1.5 bg-primary-500 text-white py-2.5 px-3 rounded-lg font-medium hover:bg-primary-600 transition-colors text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center justify-center gap-1.5 bg-green-500 text-white py-2.5 px-3 rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>

                  <button
                    onClick={closeModal}
                    className="py-2.5 px-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                  >
                    Close
                  </button>
                </div>
              </>
            )}

            {/* Final Step: Action Buttons (after payment method selected or payment marked) */}
            {selectedPaymentMethod && !showPaymentStep && (
              <>
                {/* Success Icon and Title */}
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-3">
                    <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Bill Created Successfully!
                  </h3>
                </div>

                {/* Bill Details */}
                <div className="bg-gray-50 rounded-lg p-5 mb-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Bill Number</p>
                      <p className="text-lg font-semibold text-gray-900">#{generatedBill.billNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Customer</p>
                      <p className="text-lg font-semibold text-gray-900">{generatedBill.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-primary-600">₹{generatedBill.totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Payment Method</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedPaymentMethod === 'CASH' ? '💵 Cash' : '📱 Online'}
                        {generatedBill.paymentStatus === 'PAID' && ' - ✓ Paid'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handlePrintPDF}
                    className="flex items-center justify-center gap-1.5 bg-primary-500 text-white py-2.5 px-3 rounded-lg font-medium hover:bg-primary-600 transition-colors text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center justify-center gap-1.5 bg-green-500 text-white py-2.5 px-3 rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>

                  <button
                    onClick={closeModal}
                    className="py-2.5 px-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
