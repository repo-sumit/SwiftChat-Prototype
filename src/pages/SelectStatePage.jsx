import React, { useState } from 'react'
import { Search, ChevronRight, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Logo from '../components/Logo'

const STATES = [
  { name: 'Gujarat',        abbr: 'GJ' },
  { name: 'Punjab',         abbr: 'PB' },
  { name: 'Delhi',          abbr: 'DL' },
  { name: 'Uttar Pradesh',  abbr: 'UP' },
  { name: 'Maharashtra',    abbr: 'MH' },
  { name: 'Karnataka',      abbr: 'KA' },
  { name: 'Tamil Nadu',     abbr: 'TN' },
  { name: 'West Bengal',    abbr: 'WB' },
  { name: 'Rajasthan',      abbr: 'RJ' },
  { name: 'Madhya Pradesh', abbr: 'MP' },
  { name: 'Andhra Pradesh', abbr: 'AP' },
  { name: 'Bihar',          abbr: 'BR' },
  { name: 'Odisha',         abbr: 'OD' },
  { name: 'Kerala',         abbr: 'KL' },
  { name: 'Haryana',        abbr: 'HR' },
]

const ACCENTS = ['#EEF3FF','#FFF7ED','#F0FDF4','#F5F3FF','#FFF1F2','#ECFDF5','#EFF6FF','#FFFBEB']

export default function SelectStatePage() {
  const { navigate, goBack, setSsoState, ssoState } = useApp()
  const [query, setQuery]     = useState('')
  const [selected, setSelected] = useState(ssoState || 'Gujarat')

  const filtered = STATES.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.abbr.toLowerCase().includes(query.toLowerCase())
  )

  const handleConfirm = () => {
    setSsoState(selected)
    navigate('sso_redirect')
  }

  return (
    // Uses flex-col always — single column layout
    <div className="flex-1 flex flex-col overflow-hidden bg-white">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#EEF0F6] flex-shrink-0">
        <Logo size={28} showText textColor="#1A1F36" />
        <button onClick={goBack} className="text-[13px] text-txt-secondary font-medium">
          Cancel
        </button>
      </div>

      {/* Heading */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <h1 className="text-[24px] font-bold text-txt-primary leading-tight"
          style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Select your<br />
          <span style={{ color: '#386AF6' }}>State Program</span>
        </h1>
        <p className="text-[13px] text-txt-secondary mt-1">
          Choose the state education board you belong to.
        </p>
      </div>

      {/* Search */}
      <div className="px-5 pb-3 flex-shrink-0">
        <div
          className="flex items-center gap-2 rounded-2xl border-[1.5px] px-3 py-2.5 transition-colors"
          style={{ borderColor: query ? '#386AF6' : '#E2E8F0', background: '#F8FAFC' }}
        >
          <Search size={16} className="text-txt-tertiary flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search states…"
            className="flex-1 bg-transparent text-[14px] text-txt-primary outline-none placeholder:text-txt-tertiary"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-txt-tertiary text-[12px]">✕</button>
          )}
        </div>
      </div>

      {/* State list — scrollable */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-txt-tertiary text-[14px]">
            No states match "{query}"
          </div>
        )}
        <div className="flex flex-col gap-2">
          {filtered.map((s, idx) => {
            const isSelected = selected === s.name
            const accent = ACCENTS[idx % ACCENTS.length]
            return (
              <button
                key={s.name}
                onClick={() => setSelected(s.name)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                style={{
                  background: isSelected ? '#EEF3FF' : '#F8FAFC',
                  border: `1.5px solid ${isSelected ? '#386AF6' : '#E2E8F0'}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                  style={{ background: isSelected ? '#386AF6' : accent, color: isSelected ? 'white' : '#64748B' }}
                >
                  {s.abbr}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate"
                    style={{ color: isSelected ? '#386AF6' : '#1A1F36', fontFamily: 'Montserrat, sans-serif' }}>
                    {s.name}
                  </p>
                  <p className="text-[11px] text-txt-tertiary">State Education Board · SSO enabled</p>
                </div>
                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check size={12} color="white" strokeWidth={3} />
                  </div>
                ) : (
                  <ChevronRight size={16} className="text-txt-tertiary flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Confirm button */}
      <div className="px-5 pb-6 pt-3 flex-shrink-0 border-t border-[#EEF0F6]">
        <button
          onClick={handleConfirm}
          className="w-full py-4 rounded-2xl font-bold text-[16px] text-white"
          style={{
            background: 'linear-gradient(135deg, #386AF6 0%, #5B85F8 100%)',
            fontFamily: 'Montserrat, sans-serif',
            boxShadow: '0 4px 16px rgba(56,106,246,0.35)',
          }}
        >
          Continue with {selected}
        </button>
      </div>
    </div>
  )
}
