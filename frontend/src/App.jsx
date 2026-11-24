import React, { useEffect, useRef, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { api } from './api'
import PublicAccessLayout from './PublicAccessLayout'
import { BusyButton, ErrorPanel, Field, Page, PublicFrame, Status, TopBar } from './components'
import Student from './Student'
import Staff from './Staff'
import Principal from './Principal'
import Admin from './Admin'

/*
 * DCCMP / App.jsx — quiet, accessible portal shell.
 * FRONTEND ONLY. No route, API payload, auth rule or backend changes.
 * Works with the previously supplied index.css and components.jsx.
 */

const workflow = [
  { number: '01', title: 'Verify student identity', detail: 'Use your official college email and OTP.' },
  { number: '02', title: 'Complete the required forms', detail: 'Submit Alumni Registration, then No Dues.' },
  { number: '03', title: 'Department clearance', detail: 'All 17 departments review requests in parallel.' },
  { number: '04', title: 'Principal approval', detail: 'The final approved document becomes available.' },
  { number: '05', title: 'Certificate collection', detail: 'Admin verifies documents before handover.' },
]

function SectionEyebrow({ children }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      {children}
    </span>
  )
}

function PortalCard({ to, Icon, tag, title, description, cta }) {
  return (
    <Link
      to={to}
      className="group card flex min-h-[230px] flex-col justify-between gap-8 p-6 text-inherit no-underline transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:!border-slate-300 hover:shadow-[0_12px_34px_rgba(25,42,58,0.055)] sm:p-7"
    >
      <div>
        <div className="mb-6 flex items-center justify-between gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
            <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">
            {tag}
          </span>
        </div>
        <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors group-hover:text-slate-950">
        {cta} <ArrowRight size={17} strokeWidth={1.9} aria-hidden="true" />
      </span>
    </Link>
  )
}

function Landing() {
  return (
    <PublicAccessLayout page="home">
      <section className="sdrc-home-hero" aria-labelledby="sdrc-home-title">
        <div className="sdrc-home-intro">
          <h1 id="sdrc-home-title">Student Document and Certificate Requisition Portal</h1>
          <p>Apply for academic certificates, complete No Dues clearance, track approvals and collect your documents through one college portal.</p>
          <div className="sdrc-home-actions">
            <Link className="sdrc-button sdrc-button-primary" to="/student">Student Login <ArrowRight size={15} aria-hidden="true" /></Link>
            <Link className="sdrc-button sdrc-button-outline" to="/employee">Staff Login <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="sdrc-home-process" aria-label="Application process">
          {[
            ['1', 'Submit Application'],
            ['2', 'Track Approvals'],
            ['3', 'Collect Certificates'],
          ].map(([number, title]) => (
            <div className="sdrc-process-row" key={number}>
              <span className="sdrc-process-number">{number}</span>
              <span>{title}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="sdrc-home-services" aria-label="Available services">
        <h2>Available Services</h2>
        <div className="sdrc-service-grid">
          <article className="sdrc-service-card">
            <h3>Alumni Registration &amp; No Dues</h3>
            <p>Complete one-time clearance with department reviews, Principal approval and original-document collection.</p>
          </article>
          <article className="sdrc-service-card">
            <h3>Certificate Requests</h3>
            <p>Apply for Study, Bonafide, LOR, Duplicate TC and Conduct certificates. Track status and collect after approval.</p>
          </article>
        </div>
      </section>
    </PublicAccessLayout>
  )
}

function EmployeeLogin({ onLogin, sessionMessage }) {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [captcha, setCaptcha] = useState('')
  const [captchaNeeded, setCaptchaNeeded] = useState(false)
  const [captchaNonce, setCaptchaNonce] = useState(0)

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    if (!code.trim()) { setError('Employee ID is required.'); return }
    if (!password) { setError('Password is required.'); return }
    if (captchaNeeded && captcha.trim().length !== 6) { setError('Enter all six CAPTCHA characters.'); return }
    setBusy(true)
    setError('')
    try {
      const person = await api('/auth/login', {
        method: 'POST',
        body: { code: code.trim(), password, captcha },
      })
      setPassword('')
      setCaptcha('')
      onLogin(person)
    } catch (failure) {
      const message = failure.message || 'Sign in failed. Please try again.'
      if (message.includes('CAPTCHA_REQUIRED')) {
        setCaptchaNeeded(true)
        setError(message.replace(/CAPTCHA_REQUIRED\s*:\s*/i, ''))
      } else {
        setError(message)
      }
      // The backend CAPTCHA is single-use. Refresh it after each failed attempt
      // once CAPTCHA has been requested; never silently resubmit credentials.
      if (captchaNeeded || message.includes('CAPTCHA_REQUIRED')) {
        setCaptcha('')
        setCaptchaNonce((previous) => previous + 1)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <PublicAccessLayout page="employee">
      <div className="sdrc-login-stage">
        <section className="sdrc-login-card" aria-labelledby="sdrc-staff-login-title">
          <div className="sdrc-login-stripe" aria-hidden="true" />
          <div className="sdrc-login-body">
            <h1 id="sdrc-staff-login-title">Staff Login</h1>
            <p className="sdrc-login-description">For HOD, Principal and Admin accounts</p>
            <ErrorPanel error={error || sessionMessage} />
            <form noValidate className="sdrc-login-form" onSubmit={submit}>
              <Field
                label="Staff ID"
                value={code}
                autoComplete="username"
                placeholder="Enter staff ID"
                onChange={(event) => { setCode(event.target.value); setError('') }}
                aria-required="true"
              />
              <Field
                label="Password"
                type="password"
                value={password}
                autoComplete="current-password"
                placeholder="Enter password"
                onChange={(event) => { setPassword(event.target.value); setError('') }}
                aria-required="true"
              />
              {captchaNeeded && (
                <div className="sdrc-login-captcha">
                  <label className="label">Security Verification</label>
                  <div className="sdrc-captcha-row">
                    <img
                      alt="CAPTCHA verification image"
                      src={`/api/auth/captcha?refresh=${captchaNonce}`}
                      width="180" height="62"
                    />
                    <button type="button" className="sdrc-button sdrc-button-outline" onClick={() => { setCaptcha(''); setCaptchaNonce((n) => n + 1) }}>
                      <RefreshCw size={14} aria-hidden="true" /> Refresh
                    </button>
                  </div>
                  <Field
                    label="Characters from image"
                    value={captcha}
                    maxLength={6}
                    autoComplete="off"
                    onChange={(event) => { setCaptcha(event.target.value); setError('') }}
                  />
                </div>
              )}
              <button className="sdrc-button sdrc-button-primary sdrc-login-submit" type="submit" disabled={busy} aria-busy={busy || undefined}>
                {busy ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
            <p className="sdrc-login-switch">Student? <Link to="/student">Student Login</Link></p>
          </div>
        </section>
      </div>
    </PublicAccessLayout>
  )
}

function EmployeePortal({ person, onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '' })
  const [settingsError, setSettingsError] = useState('')
  const [working, setWorking] = useState(false)
  const settingsRef = useRef(null)

  useEffect(() => {
    let last = 0
    const touch = () => {
      const now = Date.now()
      if (now - last < 30_000) return
      last = now
      api('/auth/touch', { method: 'POST', userActivity: true }).catch(() => { })
    }
    const events = ['pointerdown', 'keydown', 'touchstart']
    events.forEach((eventName) => window.addEventListener(eventName, touch, { passive: true }))
    return () => events.forEach((eventName) => window.removeEventListener(eventName, touch))
  }, [])

  useEffect(() => {
    if (!profileOpen) return
    const onClick = (event) => {
      if (!settingsRef.current?.contains(event.target)) setProfileOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setProfileOpen(false)
    }
    document.addEventListener('pointerdown', onClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [profileOpen])

  async function changePassword(event) {
    event.preventDefault()
    if (working) return
    setWorking(true)
    setSettingsError('')
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: password,
        userActivity: true,
      })
      setPassword({ currentPassword: '', newPassword: '' })
      await onLogout() // Existing backend ends the session after changing a password.
    } catch (failure) {
      setSettingsError(failure.message || 'Unable to change password.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="campus-public-page min-h-screen">
      <TopBar person={person} actions={
        <div ref={settingsRef} className="relative shrink-0">
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={profileOpen}
            onClick={() => { setSettingsError(''); setProfileOpen((open) => !open) }}
            className="btn btn-muted !min-h-9 !gap-2 !px-3"
          >
            <KeyRound size={15} /> Account settings <ChevronDown size={14} />
          </button>
          {profileOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-[min(330px,calc(100vw-30px))] rounded-md border border-slate-200 bg-white p-5 shadow-lg"
              aria-label="Account settings"
            >
              <div className="mb-4 flex items-start justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">Account settings</h3>
                  <p className="tiny mt-1 truncate">{person.code} · {person.role}</p>
                </div>
                <button type="button" onClick={() => setProfileOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close account settings"><X size={17} /></button>
              </div>
              <p className="mb-3 text-xs font-semibold text-slate-700">Change password</p>
              <ErrorPanel error={settingsError} />
              <form className="space-y-3" onSubmit={changePassword}>
                <label className="block text-xs font-medium text-slate-600">
                  Current password
                  <input className="field mt-1.5" type="password" autoComplete="current-password" required value={password.currentPassword} onChange={(event) => setPassword((value) => ({ ...value, currentPassword: event.target.value }))} />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  New password
                  <input className="field mt-1.5" type="password" autoComplete="new-password" minLength={8} required value={password.newPassword} onChange={(event) => setPassword((value) => ({ ...value, newPassword: event.target.value }))} />
                </label>
                <p className="text-[11px] leading-5 text-slate-500">At least 8 characters, including a letter and a number. Changing your password signs you out.</p>
                <BusyButton type="submit" busy={working} className="w-full">Update password</BusyButton>
              </form>
              <button type="button" className="btn btn-muted mt-3 w-full" onClick={onLogout}>Sign out</button>
            </div>
          )}
        </div>
      } />
      {person.role === 'ADMIN' ? <Admin /> : person.role === 'PRINCIPAL' ? <Principal /> : <Staff person={person} />}
    </div>
  )
}

function Verify() {
  const token = useLocation().pathname.split('/').at(-1)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setData(null)
    api(`/public/verify/${encodeURIComponent(token)}`)
      .then((result) => { if (active) setData(result) })
      .catch((failure) => { if (active) setError(failure.message || 'Verification failed.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  return (
    <div className="campus-public-page min-h-screen">
      <TopBar />
      <main className="mx-auto w-full max-w-xl px-5 py-14 sm:py-20">
        <div className="card px-6 py-9 text-center sm:px-10 sm:py-12">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600"><MailCheck size={26} /></span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">No Dues form verification</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Check the authenticity and status of an issued No Dues clearance document.</p>
          <div className="mt-6 text-left"><ErrorPanel error={error} /></div>
          {loading && <p className="mt-5 text-sm text-slate-500" role="status">Checking verification ID…</p>}
          {!loading && data && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 px-5 py-6">
              <Status value={data.valid ? 'APPROVED' : 'REJECTED'} />
              <p className="mt-4 text-sm leading-6 text-slate-700">
                {data.valid ? 'This No Dues document was issued by the college.' : 'Verification failed or the document has been revoked.'}
              </p>
              {data.valid && (
                <div className="mt-5 space-y-2 border-t border-slate-200 pt-5 text-left text-xs leading-6 text-slate-600">
                  {data.issuedAt && <p><strong className="text-slate-700">Issued:</strong> {new Date(data.issuedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST</p>}
                  <p><strong className="text-slate-700">Original certificate collection:</strong> {String(data.collectionStatus || 'NOT_COLLECTED').replaceAll('_', ' ')}</p>
                  {data.verificationId && <p className="break-all"><strong className="text-slate-700">Verification ID:</strong> {data.verificationId}</p>}
                </div>
              )}
            </div>
          )}
          <Link to="/" className="btn btn-muted mt-7">Return to home <ArrowRight size={15} /></Link>
        </div>
      </main>
    </div>
  )
}

function NotFound() {
  return (
    <div className="campus-public-page min-h-screen">
      <TopBar />
      <Page title="Page not found" subtitle="The address you entered doesn't match an available portal page.">
        <Link to="/" className="btn btn-primary">Go home <ArrowRight size={16} /></Link>
      </Page>
    </div>
  )
}

export default function App() {
  const [person, setPerson] = useState(null)
  const [sessionMessage, setSessionMessage] = useState('')
  const location = useLocation()

  useEffect(() => {
    let active = true
    api('/auth/me')
      .then((result) => { if (active) setPerson(result) })
      .catch(() => { if (active) setPerson(null) })
    return () => { active = false }
  }, [])

  // Navigating back to /employee after using /student may have changed the
  // authenticated server session. Recheck the account instead of displaying
  // a stale employee dashboard (the backend is the source of truth).
  useEffect(() => {
    if (location.pathname !== '/employee') return
    let active = true
    api('/auth/me')
      .then((result) => { if (active) setPerson(result) })
      .catch(() => { if (active) setPerson(null) })
    return () => { active = false }
  }, [location.pathname])

  useEffect(() => {
    const expired = (event) => {
      setPerson(null)
      setSessionMessage(event.detail || 'Your employee session has ended. Please sign in again.')
    }
    window.addEventListener('dccmp-session-expired', expired)
    return () => window.removeEventListener('dccmp-session-expired', expired)
  }, [])

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch {
      // The password-change endpoint may have already invalidated the session.
    } finally {
      setPerson(null)
      setSessionMessage('')
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/student" element={<Student />} />
      <Route
        path="/employee"
        element={
          person ? (
            <EmployeePortal person={person} onLogout={logout} />
          ) : (
            <EmployeeLogin
              sessionMessage={sessionMessage}
              onLogin={(result) => { setSessionMessage(''); setPerson(result) }}
            />
          )
        }
      />
      <Route path="/verify/:token" element={<Verify />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
