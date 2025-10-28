'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Building2, Mail, Phone, MapPin, FileText, Globe } from 'lucide-react'

interface StoreDetails {
  storeName: string
  address?: string
  phone?: string
  email?: string
  gstNumber?: string
  website?: string
  footerText?: string
}

export default function DetailsPage() {
  const [storeDetails, setStoreDetails] = useState<StoreDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStoreDetails()
  }, [])

  const fetchStoreDetails = async () => {
    try {
      const response = await fetch('/api/store-details')
      if (response.ok) {
        const data = await response.json()
        setStoreDetails(data.storeDetails)
      }
    } catch (error) {
      console.error('Error fetching store details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Store Details</h1>
          <p className="text-gray-600 mt-2">View your store information</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Building2 className="h-4 w-4" />
                Store Name
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {storeDetails?.storeName || 'Not set'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="text-lg text-gray-900">
                {storeDetails?.email || 'Not set'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Phone className="h-4 w-4" />
                Phone
              </div>
              <p className="text-lg text-gray-900">
                {storeDetails?.phone || 'Not set'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <FileText className="h-4 w-4" />
                GST Number
              </div>
              <p className="text-lg text-gray-900">
                {storeDetails?.gstNumber || 'Not set'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Globe className="h-4 w-4" />
                Website
              </div>
              <p className="text-lg text-gray-900">
                {storeDetails?.website || 'Not set'}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <MapPin className="h-4 w-4" />
                Address
              </div>
              <p className="text-lg text-gray-900">
                {storeDetails?.address || 'Not set'}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <FileText className="h-4 w-4" />
                Bill Footer Text
              </div>
              <p className="text-lg text-gray-900">
                {storeDetails?.footerText || 'Thank you for shopping!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
