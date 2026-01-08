'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Toast, ToastType, ToastContainer } from './Toast'

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 4000) => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, message, type, duration }])
    },
    []
  )

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'success', duration)
    },
    [showToast]
  )

  const showError = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'error', duration)
    },
    [showToast]
  )

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'info', duration)
    },
    [showToast]
  )

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'warning', duration)
    },
    [showToast]
  )

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showInfo, showWarning }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

