'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Save, Upload, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface StoreDetailsForm {
  storeName: string
  address: string
  phone: string
  email: string
  gstNumber: string
  website: string
  footerText: string
  logo: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [formData, setFormData] = useState<StoreDetailsForm>({
    storeName: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    website: '',
    footerText: 'Thank you for shopping!',
    logo: ''
  })

  useEffect(() => {
    fetchStoreDetails()
    fetchAdminEmail()
  }, [])

  const fetchAdminEmail = async () => {
    try {
      const response = await fetch('/api/admin/profile')
      if (response.ok) {
        const data = await response.json()
        setAdminEmail(data.email || '')
      }
    } catch (error) {
      console.error('Error fetching admin email:', error)
    }
  }

  const fetchStoreDetails = async () => {
    try {
      const response = await fetch('/api/store-details')
      if (response.ok) {
        const data = await response.json()
        if (data.storeDetails) {
          setFormData({
            storeName: data.storeDetails.storeName || '',
            address: data.storeDetails.address || '',
            phone: data.storeDetails.phone || '',
            email: data.storeDetails.email || '',
            gstNumber: data.storeDetails.gstNumber || '',
            website: data.storeDetails.website || '',
            footerText: data.storeDetails.footerText || 'Thank you for shopping!',
            logo: data.storeDetails.logo || ''
          })
        }
      }
    } catch (error) {
      console.error('Error fetching store details:', error)
    }
  }

  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, '')
    // Limit to 10 digits
    if (digits.length <= 10) {
      setFormData({ ...formData, phone: digits })
    }
  }

  const handleGSTChange = (value: string) => {
    // Allow alphanumeric only
    const alphanumeric = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    // Limit to 15 characters
    if (alphanumeric.length <= 15) {
      setFormData({ ...formData, gstNumber: alphanumeric })
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, logo: data.url }))
        alert('Logo uploaded successfully')
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      alert('Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate phone number
    if (formData.phone && formData.phone.length !== 10) {
      alert('Phone number must be exactly 10 digits')
      return
    }
    
    // Validate GST number
    if (formData.gstNumber && formData.gstNumber.length !== 15) {
      alert('GST number must be exactly 15 characters')
      return
    }
    
    setLoading(true)

    try {
      const response = await fetch('/api/store-details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Store details updated successfully')
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      alert('Failed to update store details')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your store information that appears on bills and invoices
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {/* Logo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Logo
            </label>
            <div className="flex items-center gap-4">
              {formData.logo && (
                <div className="relative h-24 w-24 rounded-lg border-2 border-gray-200 overflow-hidden">
                  <Image
                    src={formData.logo}
                    alt="Store logo"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('logo')?.click()}
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
                      Upload Logo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Name *
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Admin Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email (Account Email)
              </label>
              <input
                type="email"
                value={adminEmail}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                title="This is your account email and cannot be changed"
              />
              <p className="text-xs text-gray-500 mt-1">This email was used to create your account and cannot be changed</p>
            </div>

            {/* Store Contact Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Contact Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="store@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">This email will appear on bills and invoices</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="10 digits only"
                maxLength={10}
                pattern="[0-9]{10}"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.phone.length}/10 digits {formData.phone && formData.phone.length !== 10 && '(Must be exactly 10 digits)'}
              </p>
            </div>

            {/* GST Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number
              </label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => handleGSTChange(e.target.value)}
                placeholder="15 characters (alphanumeric)"
                maxLength={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.gstNumber.length}/15 characters {formData.gstNumber && formData.gstNumber.length !== 15 && '(Must be exactly 15 characters)'}
              </p>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Footer Text */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill Footer Text
              </label>
              <input
                type="text"
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                placeholder="Thank you for shopping!"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                This text will appear at the bottom of all bills
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
