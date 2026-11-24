import React, { useEffect, useState } from 'react'
import { api } from './api'
import { Empty, ErrorPanel, Status } from './components'
import { ArrowLeft, ArrowRight, ClipboardList, Files, History, RefreshCw, ShieldCheck } from 'lucide-react'

const TYPES = {
  STUDY: 'Study Certificate', BONAFIDE: 'Bonafide Certificate',
  LOR: 'Letter of Recommendation (LOR)', DUPLICATE_TC: 'Duplicate Transfer Certificate (TC)',
  CONDUCT: 'Conduct Certificate',
}
const COMPLETE = ['REJECTED', 'CANCELLED', 'COLLECTED', 'EXPIRED']
const date = value => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : '—'

export default function CertificateServices({ person, requestedPage, onPageChange }) {
  const [page, setPage] = useState('apply')
  const [requests, setRequests] = useState([])
  const [branches, setBranches] = useState([])
  const [details, setDetails] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invalid, setInvalid] = useState({})
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ certificateType: 'STUDY', branch: '', purpose: '', remarks: '', studentName: person.studentName || '' })
  const navigate = (next) => { setPage(next); if (next === 'apply' || next === 'requests') onPageChange?.(next) }

  async function refresh() {
    setError('')
    try {
      const [items, availableBranches] = await Promise.all([api('/student/certificates'), api('/certificates/branches')])
      setRequests(Array.isArray(items) ? items : [])
      setBranches(Array.isArray(availableBranches) ? availableBranches : [])
      setForm(current => ({ ...current, branch: availableBranches.some(item => item.code === current.branch) ? current.branch : (availableBranches[0]?.code || '') }))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { refresh() }, [])
  useEffect(() => { if (requestedPage === 'apply' || requestedPage === 'requests') setPage(requestedPage) }, [requestedPage])

  const existing = requests.find(item => item.certificateType === form.certificateType && !COMPLETE.includes(item.status))

  async function submit(event) {
    event.preventDefault()
    setError(''); setMessage('')
    const problems = {}
    if (!(person.studentName || form.studentName || '').trim()) problems.studentName = 'Student name is required.'
    if (!form.branch) problems.branch = 'Select a branch for HOD approval.'
    if (!form.purpose.trim()) problems.purpose = 'Purpose is required.'
    if (existing) problems.certificateType = 'An active application of this certificate type already exists.'
    setInvalid(problems)
    if (Object.keys(problems).length) { setError('Please correct the highlighted fields before submitting.'); return }
    setBusy(true)
    try {
      await api('/student/certificates', { method: 'POST', body: form })
      setForm(current => ({ ...current, purpose: '', remarks: '' }))
      setMessage('Your request has been submitted to the selected branch HOD.')
      await refresh()
      navigate('requests')
    } catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }
  async function openDetails(id) {
    setError(''); setLoading(true)
    try { setDetails(await api(`/student/certificates/${id}`)); setPage('details') }
    catch (failure) { setError(failure.message) }
    finally { setLoading(false) }
  }

  return <section className="card campus-service-section p-5 sm:p-7" id="certificate-services" aria-label="Certificate Services">
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>

        <h2 className="campus-service-heading flex items-center gap-2"><Files size={19} strokeWidth={1.8} /> Certificate Services</h2>

      </div>
      <button type="button" className="btn btn-muted" onClick={refresh} disabled={loading}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>
    </header>

    <nav className="campus-service-tabs" aria-label="Certificate Services pages">
      {[
        ['apply', 'Apply for Certificate', ClipboardList],
        ['requests', 'My Certificate Requests', Files],
        ['details', 'Details & Approval History', History],
      ].map(([key, label, Icon]) => <button type="button" key={key} className={`btn btn-muted ${page === key ? 'is-active' : ''}`} aria-current={page === key ? 'page' : undefined} onClick={() => navigate(key)}><Icon size={15} />{label}</button>)}
    </nav>
    <ErrorPanel error={error} />
    {message && <p className="campus-service-note mb-5" role="status">{message}</p>}

    {page === 'apply' && <div>
      <div className="mb-5"><h3 className="campus-service-subheading">New Certificate Application</h3></div>
      <form noValidate className="max-w-3xl space-y-4" onSubmit={submit}>
        <div className="input-grid">
          <label className="block"><span className="label">Roll number</span><input className="field" value={person.rollNumber || ''} readOnly /></label>
          <label className="block"><span className="label">Student name</span><input className="field" value={person.studentName || form.studentName} readOnly={Boolean(person.directoryMatched)} aria-invalid={Boolean(invalid.studentName)} required onChange={e => { setForm(v => ({ ...v, studentName: e.target.value })); setInvalid(v => ({ ...v, studentName: null })) }} />{invalid.studentName && <span className="sd-field-error" role="alert">{invalid.studentName}</span>}</label>
          <label className="block"><span className="label">Certificate type</span><select className="field" value={form.certificateType} onChange={e => setForm(v => ({ ...v, certificateType: e.target.value }))}>{Object.entries(TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="block"><span className="label">Routing branch (approving HOD)</span><select className="field" value={form.branch} aria-invalid={Boolean(invalid.branch)} required onChange={e => { setForm(v => ({ ...v, branch: e.target.value })); setInvalid(v => ({ ...v, branch: null })) }}><option value="" disabled>Select branch</option>{branches.map(branch => <option key={branch.code} value={branch.code}>{branch.name}</option>)}</select>{invalid.branch && <span className="sd-field-error" role="alert">{invalid.branch}</span>}</label>
        </div>
        <label className="block"><span className="label">Purpose of the certificate</span><textarea className="field" rows={3} maxLength={2000} required value={form.purpose} aria-invalid={Boolean(invalid.purpose)} placeholder="Explain why you require this certificate" onChange={e => { setForm(v => ({ ...v, purpose: e.target.value })); setInvalid(v => ({ ...v, purpose: null })) }} />{invalid.purpose && <span className="sd-field-error" role="alert">{invalid.purpose}</span>}</label>
        <label className="block"><span className="label">Additional remarks (optional)</span><textarea className="field" rows={2} value={form.remarks} onChange={e => setForm(v => ({ ...v, remarks: e.target.value }))} /></label>
        {existing && <p className="campus-service-note" role="status">An active {TYPES[form.certificateType]} request (#{existing.id}) already exists. A new request is available after collection, rejection, cancellation or expiration.</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"><button className="btn btn-primary" type="submit" disabled={busy || loading}>{busy ? 'Submitting…' : 'Submit application'} <ArrowRight size={15} /></button></div>
      </form>
    </div>}

    {page === 'requests' && <div>
      <h3 className="campus-service-subheading mb-4">Previous and current requests</h3>
      <div className="table-wrap"><table><thead><tr>{['Request', 'Certificate type', 'Approving branch', 'Submitted', 'Status', 'Collection deadline', ''].map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{requests.map(item => <tr key={item.id}><td className="font-semibold">#{item.id}</td><td>{TYPES[item.certificateType] || item.certificateType}</td><td>{item.branch}</td><td>{date(item.submittedAt)}</td><td><Status value={item.status} /></td><td>{date(item.expiresAt)}</td><td><button type="button" className="btn btn-muted" onClick={() => openDetails(item.id)}>View details <ArrowRight size={14} /></button></td></tr>)}</tbody></table></div>
      {!requests.length && <Empty message="No certificate requests submitted yet." />}
    </div>}

    {page === 'details' && (details ? <div className="max-w-3xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h3 className="campus-service-subheading">Request #{details.id} · {TYPES[details.certificateType]}</h3><p className="tiny mt-1">Submitted {date(details.submittedAt)} · HOD branch: {details.branch}</p></div><Status value={details.status} /></div>
      <div className="campus-service-note mb-4"><span className="label">Purpose</span>{details.purpose}</div>
      {details.expiresAt && <p className="text-sm text-slate-600 mb-3">Collection deadline: <b>{date(details.expiresAt)}</b></p>}
      {details.cancellationReason && <p className="text-sm text-slate-600 mb-3">Cancellation reason: {details.cancellationReason}</p>}
      <h4 className="campus-service-subheading mb-2">Approval and collection history</h4>
      <div className="rounded-md border border-slate-200 px-4">{(details.history || []).map(event => <div key={event.id} className="campus-service-row"><p className="text-sm font-semibold text-slate-800">{String(event.action).replaceAll('_', ' ')}</p><p className="tiny mt-1">{date(event.occurredAt)} · {event.actorRole}</p>{event.remarks && <p className="text-sm text-slate-600 mt-2">{event.remarks}</p>}</div>)}{!details.history?.length && <p className="tiny py-5">No decisions recorded yet.</p>}</div>
      <button type="button" className="btn btn-muted mt-5" onClick={() => navigate('requests')}><ArrowLeft size={15} /> Back to requests</button>
    </div> : <div className="campus-service-note">Select a request from My Certificate Requests to see its approval history.</div>)}
  </section>
}
