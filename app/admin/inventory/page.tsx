'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Plus, Edit, Trash2, Search, AlertTriangle, Upload, Loader2, Package } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/components/ToastProvider'

interface Product {
  id: string
  name: string
  sku?: string
  category?: string
  price: number
  quantityInStock: number
  lowStockThreshold: number
  imageUrl?: string
}

export default function InventoryPage() {
  const { showSuccess, showError } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    quantityInStock: '',
    lowStockThreshold: '5',
    imageUrl: '',
  })

  useEffect(() => {
    fetchProducts()
  }, [search])

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/inventory?search=${search}`)
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, imageUrl: data.url }))
        showSuccess('Image uploaded successfully')
      } else {
        showError('Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      showError('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('') // Clear previous errors
    
    const payload = {
      name: formData.name,
      sku: formData.sku || undefined,
      category: formData.category || undefined,
      price: parseFloat(formData.price),
      quantityInStock: parseInt(formData.quantityInStock),
      lowStockThreshold: parseInt(formData.lowStockThreshold),
      imageUrl: formData.imageUrl || undefined,
    }

    try {
      const url = editingProduct ? `/api/inventory/${editingProduct.id}` : '/api/inventory'
      const method = editingProduct ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        fetchProducts()
        closeModal()
      } else {
        // Handle error response
        const data = await response.json()
        setError(data.error || 'Failed to save product')
      }
    } catch (error) {
      console.error('Failed to save product:', error)
      setError('Failed to save product. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
      fetchProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  const openModal = (product?: Product) => {
    setError('') // Clear any previous errors
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        sku: product.sku || '',
        category: product.category || '',
        price: product.price.toString(),
        quantityInStock: product.quantityInStock.toString(),
        lowStockThreshold: product.lowStockThreshold.toString(),
        imageUrl: product.imageUrl || '',
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        sku: '',
        category: '',
        price: '',
        quantityInStock: '',
        lowStockThreshold: '5',
        imageUrl: '',
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setError('')
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory Management</h1>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Products - Desktop Table / Mobile Cards */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No products found. Add your first product!
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <div className="relative h-12 w-12 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="font-medium text-gray-900">{product.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {product.sku || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {product.category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.quantityInStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.quantityInStock <= product.lowStockThreshold ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openModal(product)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : products.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No products found. Add your first product!</div>
            ) : (
              products.map((product) => (
                <div key={product.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3 mb-3">
                    {product.imageUrl ? (
                      <div className="relative h-16 w-16 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-600">
                        {product.sku && <span>SKU: {product.sku}</span>}
                        {product.category && <span>• {product.category}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="text-sm font-semibold text-gray-900">₹{product.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Stock</p>
                      <p className="text-sm font-semibold text-gray-900">{product.quantityInStock}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {product.quantityInStock <= product.lowStockThreshold ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        In Stock
                      </span>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => openModal(product)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[95vh] my-4 flex flex-col shadow-2xl">
            <div className="overflow-y-auto flex-1 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h2>
                <button
                  onClick={closeModal}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                <div className="flex items-center gap-4">
                  {formData.imageUrl && (
                    <div className="relative h-20 w-20 rounded-lg border-2 border-gray-200 overflow-hidden">
                      <Image
                        src={formData.imageUrl}
                        alt="Product"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <input
                      id="productImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('productImage')?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload Image
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity in Stock *</label>
                <input
                  type="number"
                  value={formData.quantityInStock}
                  onChange={(e) => setFormData({ ...formData, quantityInStock: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold *</label>
                <input
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              </form>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-white sticky bottom-0 rounded-b-xl">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="productForm"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
