'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Store, User, Lock, Mail, ArrowLeft, Home, Eye, EyeOff, X } from 'lucide-react'

export default function SignIn() {
  const router = useRouter()
  const [userType, setUserType] = useState<'admin' | 'cashier'>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'reset'>('email')
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordOTP, setForgotPasswordOTP] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('legacy', {
        email,
        password,
        employeeId: userType === 'cashier' ? employeeId : undefined,
        userType,
        redirect: false,
      })

      if (result?.error) {
        // Show user-friendly error messages
        const errorMessage = result.error
        if (errorMessage.includes('FATAL') || errorMessage.includes('database') || errorMessage.includes('querying')) {
          setError('Database connection error. Please try again or contact support.')
        } else {
          setError(errorMessage)
        }
      } else {
        if (userType === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/cashier/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPasswordEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setForgotPasswordSuccess('')
    setForgotPasswordLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setForgotPasswordSuccess(data.message || 'OTP has been sent to your email.')
        setForgotPasswordStep('otp')
      } else {
        // Show user-friendly error messages
        let errorMsg = data.error || 'Failed to send OTP'
        if (errorMsg.includes('FATAL') || errorMsg.includes('database') || errorMsg.includes('querying')) {
          errorMsg = 'Database connection error. Please try again or contact support.'
        }
        setError(errorMsg)
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleForgotPasswordOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setForgotPasswordSuccess('')
    setForgotPasswordLoading(true)

    try {
      // Verify OTP and move to reset step
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          otp: forgotPasswordOTP,
          newPassword: 'verify_only', // Special flag to just verify OTP
        }),
      })

      if (response.ok) {
        setForgotPasswordStep('reset')
      } else {
        const data = await response.json()
        let errorMsg = data.error || 'Invalid OTP'
        if (errorMsg.includes('FATAL') || errorMsg.includes('database') || errorMsg.includes('querying')) {
          errorMsg = 'Database connection error. Please try again or contact support.'
        }
        setError(errorMsg)
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setForgotPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setForgotPasswordLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          otp: forgotPasswordOTP,
          newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setForgotPasswordSuccess('Password reset successfully! You can now login with your new password.')
        setError('') // Clear any errors
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          setShowForgotPassword(false)
          setForgotPasswordStep('email')
          setForgotPasswordEmail('')
          setForgotPasswordOTP('')
          setNewPassword('')
          setConfirmPassword('')
          setForgotPasswordSuccess('')
        }, 3000)
      } else {
        let errorMsg = data.error || 'Failed to reset password'
        if (errorMsg.includes('FATAL') || errorMsg.includes('database') || errorMsg.includes('querying')) {
          errorMsg = 'Database connection error. Please try again or contact support.'
        }
        setError(errorMsg)
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative">
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-600 hover:text-primary-500 transition-colors font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200"
      >
        <Home className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setUserType('admin')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              userType === 'admin'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setUserType('cashier')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              userType === 'cashier'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cashier
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {userType === 'admin' ? 'Email' : 'Username'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {userType === 'admin' ? (
                  <Mail className="h-5 w-5 text-gray-400" />
                ) : (
                  <User className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={userType === 'admin' ? 'admin@example.com' : 'username'}
                required
              />
            </div>
          </div>

          {userType === 'cashier' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                  placeholder="EMP-XXXXXX"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {userType === 'admin' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true)
                  setForgotPasswordStep('email')
                  setError('')
                  setForgotPasswordSuccess('')
                }}
                className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {userType === 'admin' && (
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary-500 hover:text-primary-600 font-medium">
              Register
            </Link>
          </p>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => {
                setShowForgotPassword(false)
                setForgotPasswordStep('email')
                setForgotPasswordEmail('')
                setForgotPasswordOTP('')
                setNewPassword('')
                setConfirmPassword('')
                setError('')
                setForgotPasswordSuccess('')
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
            </div>

            {forgotPasswordStep === 'email' && (
              <form onSubmit={handleForgotPasswordEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {forgotPasswordSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    {forgotPasswordSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotPasswordLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            )}

            {forgotPasswordStep === 'otp' && (
              <form onSubmit={handleForgotPasswordOTP} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm mb-4">
                  OTP has been sent to <strong>{forgotPasswordEmail}</strong>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={forgotPasswordOTP}
                    onChange={(e) => setForgotPasswordOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotPasswordLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            )}

            {forgotPasswordStep === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Min. 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Confirm password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {forgotPasswordSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    {forgotPasswordSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotPasswordLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
