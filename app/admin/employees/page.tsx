'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Plus, Trash2, UserCircle, Search, Eye, EyeOff, Copy, Check } from 'lucide-react'

interface Employee {
  id: string
  username: string
  employeeId?: string
  createdAt: string
  _count: {
    bills: number
  }
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [visibleEmployeeIds, setVisibleEmployeeIds] = useState<Set<string>>(new Set())
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredEmployees(employees)
    } else {
      const filtered = employees.filter(emp =>
        emp.username.toLowerCase().includes(search.toLowerCase())
      )
      setFilteredEmployees(filtered)
    }
  }, [search, employees])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      setEmployees(data)
      setFilteredEmployees(data)
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchEmployees()
        setShowModal(false)
        setFormData({ username: '', password: '' })
        setShowPassword(false)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create employee')
      }
    } catch (error) {
      setError('An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return

    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' })
      fetchEmployees()
    } catch (error) {
      console.error('Failed to delete employee:', error)
    }
  }

  const toggleEmployeeIdVisibility = (employeeId: string) => {
    setVisibleEmployeeIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId)
      } else {
        newSet.add(employeeId)
      }
      return newSet
    })
  }

  const copyEmployeeId = async (employeeId: string) => {
    try {
      await navigator.clipboard.writeText(employeeId)
      setCopiedIds(prev => new Set(prev).add(employeeId))
      setTimeout(() => {
        setCopiedIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(employeeId)
          return newSet
        })
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employee Management</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees by username..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Cashier Accounts</h2>
          </div>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Bills
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      {search ? 'No employees found matching your search.' : 'No employees yet. Add your first cashier!'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => {
                    const isVisible = employee.employeeId ? visibleEmployeeIds.has(employee.employeeId) : false
                    const isCopied = employee.employeeId ? copiedIds.has(employee.employeeId) : false
                    return (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <UserCircle className="w-8 h-8 text-gray-400" />
                            <span className="font-medium text-gray-900">{employee.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(employee.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {employee.employeeId ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-gray-900">
                                {isVisible ? employee.employeeId : 'XXXXXX'}
                              </span>
                              <button
                                onClick={() => {
                                  toggleEmployeeIdVisibility(employee.employeeId!)
                                  if (!isVisible) {
                                    copyEmployeeId(employee.employeeId!)
                                  }
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title={isVisible ? 'Hide and copy ID' : 'Show and copy ID'}
                              >
                                {isVisible ? (
                                  <EyeOff className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <Eye className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                              {isCopied && (
                                <Check className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee._count.bills} bills
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {search ? 'No employees found matching your search.' : 'No employees yet. Add your first cashier!'}
              </div>
            ) : (
              filteredEmployees.map((employee) => {
                const isVisible = employee.employeeId ? visibleEmployeeIds.has(employee.employeeId) : false
                const isCopied = employee.employeeId ? copiedIds.has(employee.employeeId) : false
                return (
                  <div key={employee.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <UserCircle className="w-10 h-10 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{employee.username}</h3>
                          <div className="mt-1 flex flex-col gap-1 text-sm text-gray-600">
                            <span>{new Date(employee.createdAt).toLocaleDateString()}</span>
                            <div className="flex items-center gap-2">
                              <span>• {employee._count.bills} bills</span>
                              {employee.employeeId && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">
                                    {isVisible ? employee.employeeId : 'XXXXXX'}
                                  </span>
                                  <button
                                    onClick={() => {
                                      toggleEmployeeIdVisibility(employee.employeeId!)
                                      if (!isVisible) {
                                        copyEmployeeId(employee.employeeId!)
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                  >
                                    {isVisible ? (
                                      <EyeOff className="w-4 h-4 text-gray-600" />
                                    ) : (
                                      <Eye className="w-4 h-4 text-gray-600" />
                                    )}
                                  </button>
                                  {isCopied && (
                                    <Check className="w-4 h-4 text-green-500" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[95vh] my-4 p-4 sm:p-6 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Add Cashier Account</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setError('')
                  setFormData({ username: '', password: '' })
                }}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <form id="employeeForm" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="cashier1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Min. 6 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              </form>
            </div>
            <div className="pt-4 border-t border-gray-200 mt-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setError('')
                    setFormData({ username: '', password: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="employeeForm"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Add Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
