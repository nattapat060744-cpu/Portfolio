'use client'

import { useMemo, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Kind = 'text' | 'image' | 'file' | 'link' | 'list' | 'number' | 'choice'
const KIND: Record<Kind, string> = {
  text: 'ข้อความ', image: 'รูปภาพ', file: 'ไฟล์', link: 'ลิงก์', list: 'รายการ', number: 'ตัวเลข', choice: 'ตัวเลือก',
}

// where = which part of the public site this card appears in
export function Card({ title, hint, where, children }: {
  title: string
  hint?: string
  where?: { label: string; anchor?: string }
  children: ReactNode
}) {
  return (
    <div className="ad-card">
      <div className="ad-ch">
        <h2>{title}</h2>
        {where && (
          <span className="wh">
            📍 แสดงที่: {where.label}
            {where.anchor !== undefined && (
              <a href={'/' + where.anchor} target="_blank" rel="noopener noreferrer">ดูบนเว็บ ↗</a>
            )}
          </span>
        )}
      </div>
      {hint && <p className="hint">{hint}</p>}
      {children}
    </div>
  )
}

// kind = the type of data in this field (shown as a small colored tag)
export function Field({ label, hint, kind, children }: { label: string; hint?: string; kind?: Kind; children: ReactNode }) {
  return (
    <div className="fld">
      <label>
        {label}
        {kind && <span className={'kd kd-' + kind}>{KIND[kind]}</span>}
      </label>
      {children}
      {hint && <small>{hint}</small>}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="tgl">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="tr" />
      <span>{label}</span>
    </label>
  )
}

// type a word and press Enter or comma to add it as a chip
export function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState('')

  const add = (raw: string) => {
    const parts = raw.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
    if (parts.length === 0) return
    const next = [...value]
    parts.forEach((p) => {
      if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p)
    })
    onChange(next)
    setText('')
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(text)
    } else if (e.key === 'Backspace' && !text && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="tags">
      {value.map((t, i) => (
        <span className="t" key={t + i}>
          {t}
          <button type="button" aria-label={`ลบ ${t}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
        </span>
      ))}
      <input
        value={text}
        placeholder={value.length ? '' : placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => add(text)}
      />
    </div>
  )
}

// repeatable rows with move up / move down / delete
export function ListEditor<T extends object>({
  items, onChange, blank, addLabel, render,
}: {
  items: T[]
  onChange: (v: T[]) => void
  blank: T
  addLabel: string
  render: (item: T, upd: (patch: Partial<T>) => void) => ReactNode
}) {
  const update = (i: number, patch: Partial<T>) =>
    onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const next = [...items]
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
    onChange(next)
  }

  return (
    <div>
      {items.map((it, i) => (
        <div className="ad-row" key={i}>
          <div className="ad-rc">
            <button type="button" className="mini" onClick={() => move(i, -1)} disabled={i === 0} aria-label="เลื่อนขึ้น">▲</button>
            <button type="button" className="mini" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="เลื่อนลง">▼</button>
            <button type="button" className="mini" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="ลบรายการ">✕</button>
          </div>
          {render(it, (patch) => update(i, patch))}
        </div>
      ))}
      <button type="button" className="btn sm alt" onClick={() => onChange([...items, { ...blank }])}>+ {addLabel}</button>
    </div>
  )
}

// upload an image / file to the "portfolio" storage bucket
export function Uploader({
  value, onChange, folder, accept, preview = true,
}: {
  value: string
  onChange: (url: string) => void
  folder: string
  accept: string
  preview?: boolean
}) {
  const sb = useMemo(() => createClient(), [])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const up = async (file: File) => {
    setBusy(true)
    setErr('')
    const path = `${folder}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
    const { error } = await sb.storage.from('portfolio').upload(path, file)
    if (error) setErr('อัปโหลดไม่สำเร็จ: ' + error.message)
    else onChange(sb.storage.from('portfolio').getPublicUrl(path).data.publicUrl)
    setBusy(false)
  }

  return (
    <div>
      {preview && value && (
        <div className="up-prev">
          <img src={value} alt="" />
          <button type="button" className="btn sm danger" onClick={() => onChange('')}>ลบรูป</button>
        </div>
      )}
      {!preview && value && (
        <p className="up-file">
          📎 <a href={value} target="_blank" rel="noopener noreferrer">เปิดไฟล์ที่อัปโหลดไว้</a>{' '}
          <button type="button" className="btn sm danger" onClick={() => onChange('')}>ลบ</button>
        </p>
      )}
      <label className="up-btn">
        {busy ? 'กำลังอัปโหลด...' : value ? '↻ เปลี่ยนไฟล์' : '⬆ เลือกไฟล์'}
        <input type="file" accept={accept} hidden onChange={(e) => e.target.files?.[0] && up(e.target.files[0])} />
      </label>
      <details className="up-link">
        <summary>หรือวางลิงก์แทนการอัปโหลด</summary>
        <input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />
      </details>
      {err && <div className="msg err">{err}</div>}
    </div>
  )
}

export function SaveBar({ onSave, busy, disabled, status, children }: {
  onSave: () => void
  busy: boolean
  disabled?: boolean
  status?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="ad-save">
      <div className="st">{status}</div>
      {children}
      <button type="button" className="btn" onClick={onSave} disabled={busy || disabled}>
        {busy ? 'กำลังบันทึก...' : '💾 บันทึก'}
      </button>
    </div>
  )
}

// several images at once (project gallery) with reorder / delete
export function GalleryUploader({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const sb = useMemo(() => createClient(), [])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const up = async (files: FileList) => {
    setBusy(true)
    setErr('')
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${file.name.replace(/[^\w.-]/g, '_')}`
      const { error } = await sb.storage.from('portfolio').upload(path, file)
      if (error) {
        setErr('อัปโหลดไม่สำเร็จ: ' + error.message)
        break
      }
      urls.push(sb.storage.from('portfolio').getPublicUrl(path).data.publicUrl)
    }
    if (urls.length > 0) onChange([...value, ...urls])
    setBusy(false)
  }

  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= value.length) return
    const next = [...value]
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
    onChange(next)
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="gal-ed">
          {value.map((u, i) => (
            <div className="gi" key={u + i}>
              <img src={u} alt="" />
              <div className="gc">
                <button type="button" className="mini" onClick={() => move(i, -1)} disabled={i === 0} aria-label="เลื่อนซ้าย">◀</button>
                <button type="button" className="mini" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="เลื่อนขวา">▶</button>
                <button type="button" className="mini" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="ลบรูป">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <label className="up-btn">
        {busy ? 'กำลังอัปโหลด...' : '⬆ เพิ่มรูป (เลือกได้หลายรูปพร้อมกัน)'}
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) up(e.target.files)
            e.target.value = ''
          }}
        />
      </label>
      {err && <div className="msg err">{err}</div>}
    </div>
  )
}
