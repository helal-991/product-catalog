import React, { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/router'
import {
  auth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
} from '@/lib/firebase'
import { onAuthStateChanged, ConfirmationResult } from 'firebase/auth'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)

  useEffect(() => {
    if (!auth) return
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/products')
      }
    })
    return () => unsub()
  }, [router])

  const setupRecaptcha = () => {
    if (!auth || !window) return null
    if ((window as any).recaptchaVerifier) {
      ;(window as any).recaptchaVerifier.clear()
    }
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
    (window as any).recaptchaVerifier = verifier
    return verifier
  }

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (!auth || !phone) return

    setError('')
    setLoading(true)

    try {
      const verifier = setupRecaptcha()
      if (!verifier) throw new Error('Failed to setup reCAPTCHA')

      const formattedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`
      const result = await signInWithPhoneNumber(auth, formattedPhone, verifier)
      setConfirmation(result)
      setStep('otp')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (!confirmation || !otp) return

    setError('')
    setLoading(true)

    try {
      await confirmation.confirm(otp)
      router.replace('/products')
    } catch (err: any) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep('phone')
    setOtp('')
    setError('')
    setConfirmation(null)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Product Catalog</h1>
        <p>Enter your phone number to verify</p>

        {error && <div className="error-msg">{error}</div>}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="login-form">
            <div className="input-group">
              <label>Phone Number</label>
              <div className="phone-input-wrap">
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="login-form">
            <div className="input-group">
              <label>OTP Code</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                autoFocus
                maxLength={6}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button type="button" className="btn btn-outline" onClick={handleReset}>
              Change phone number
            </button>
          </form>
        )}

        <div id="recaptcha-container" />
      </div>
    </div>
  )
}
