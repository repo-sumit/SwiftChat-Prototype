import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Plus, Search, Send, Upload, ChevronRight, ArrowLeft, Camera, FileUp, Eye,
  Download, X, Menu, Sparkles,
  CalendarCheck, BarChart3, ScanLine, Award, AlertTriangle,
  MessageSquare, FileText, UserRound, BookOpen, GraduationCap,
  TrendingUp, Building2, Map, Brain, Clock,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  STUDENTS, PERF_DATA, AT_RISK_STUDENTS, SCHOLARSHIP_DATA,
  DISTRICTS, STATE_SUMMARY, LEARNING_OUTCOMES, NAMO_LAXMI_APPS,
  SCHOOL_INFO, XAMTA_SAMPLE_RESULTS, getAttendanceHistory,
} from '../data/mockData'
import { ROLE_BOTS, ROLE_SUGGESTIONS } from '../roles/roleConfig'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const SCHOOL = SCHOOL_INFO?.name || 'Sardar Patel Prathmik Shala'
const TODAY = new Date().toLocaleDateString('en-GB',{ day:'2-digit',month:'2-digit',year:'numeric' }).replace(/\//g,'/')

const CHAT_HISTORY = {
  TODAY:    ['VSK 3.0 Demo Session','Block attendance review','Grade 6 lesson planning'],
  YESTERDAY:['District quarterly report','Scholarship coverage analysis'],
  'PREVIOUS 7 DAYS':['State KPI dashboard','Inspection readiness check'],
}

// Role metadata — reads from USER_PROFILES when available
const ROLE_META = {
  teacher:         { name:'Ms. Priya Mehta',  org:'GPS Mehsana',        badge:'Teacher'         },
  principal:       { name:'Mr. Rakesh Joshi', org:'GPS Mehsana',        badge:'Principal'       },
  deo:             { name:'Mr. Amit Trivedi', org:'Ahmedabad District', badge:'DEO'             },
  state_secretary: { name:'Ms. Nidhi Shah',   org:'Gujarat Dept. Edu.', badge:'State Secretary' },
  parent:          { name:'Meena Patel',       org:'Parent Portal',      badge:'Parent'          },
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTIFACT BUILDERS  (return { title, icon, html })
// ─────────────────────────────────────────────────────────────────────────────
function pill(val, hi=85, mid=70) {
  const c = val>=hi ? '#dcfce7:#166534' : val>=mid ? '#fef9c3:#854d0e' : '#fee2e2:#991b1b'
  const [bg, fg] = c.split(':')
  return `<span style="background:${bg};color:${fg};padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600">${val}%</span>`
}
function levelPill(lvl) {
  const map = { Advanced:'#dbeafe:#1d4ed8', Proficient:'#dbeafe:#1d4ed8', Basic:'#fff7ed:#c2410c', 'Below Basic':'#fee2e2:#991b1b' }
  const [bg,fg] = (map[lvl]||'#f3f4f6:#374151').split(':')
  return `<span style="background:${bg};color:${fg};padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600">${lvl}</span>`
}

function buildAttendanceArtifact(ctx) {
  const grade = ctx.grade || '8'
  const students = STUDENTS[grade] || STUDENTS[8]
  const absent = students.filter((_,i) => ctx.absentIdx?.includes(i))
  const present = students.length - absent.length
  const rows = students.map((s,i) => {
    const isAbsent = ctx.absentIdx?.includes(i)
    return `<div style="display:flex;align-items:center;padding:12px 0;border-bottom:1px solid #f0f0f0;gap:12px">
      <div style="flex:1"><strong style="font-size:14px">${s.name}</strong> <span style="color:#999;font-size:12px">${s.id}</span></div>
      <span style="background:${isAbsent?'#fee2e2':'#dcfce7'};color:${isAbsent?'#991b1b':'#166534'};padding:3px 14px;border-radius:20px;font-size:13px;font-weight:600">${isAbsent?'Absent':'Present'}</span>
    </div>`
  }).join('')
  const html = `
    <div style="font-family:Inter,sans-serif;padding:0 4px">
      <h2 style="font-size:22px;font-weight:700;margin:0 0 4px">Attendance Register</h2>
      <p style="color:#666;font-size:13px;margin:0 0 20px">${SCHOOL} - Grade ${grade} - ${TODAY}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px">
          <div style="font-size:12px;color:#666;margin-bottom:4px">Present</div>
          <div style="font-size:32px;font-weight:700;color:#16a34a">${present}</div>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px">
          <div style="font-size:12px;color:#666;margin-bottom:4px">Absent</div>
          <div style="font-size:32px;font-weight:700;color:#dc2626">${students.length-present}</div>
        </div>
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px">${rows}</div>
    </div>`
  return { title:'Attendance', icon:'📅', html }
}

function buildLessonPlanArtifact(ctx) {
  const { subject='Mathematics', grade='8', topic='Photosynthesis' } = ctx
  const sections = [
    { color:'#f97316', title:'Learning Objectives', items:[
      `Understand the core concept of ${topic}`,
      'Identify and explain key elements with examples',
      'Apply the concept to solve practice problems',
      'Demonstrate understanding through group activity',
    ]},
    { color:'#eab308', title:'Teaching Materials', items:[
      'Whiteboard and colored markers',
      'Chart paper with diagrams',
      'Practice worksheet (printed)',
      'G-SHALA digital content module',
    ]},
    { color:'#22c55e', title:'Lesson Flow', items:[
      `<strong>Introduction (7 min):</strong> Begin with a real-world question about ${topic}. Engage students with a hands-on warm-up activity.`,
      `<strong>Concept Explanation (12 min):</strong> Use visual aids and step-by-step board work. Reference chart paper for key points.`,
      `<strong>Guided Practice (12 min):</strong> Solve 3-4 problems as a class. Students practice similar problems individually.`,
      `<strong>Group Activity (9 min):</strong> Students work in groups to apply concepts and present findings.`,
      `<strong>Assessment (5 min):</strong> Exit ticket — 2 questions checking understanding.`,
    ]},
  ]
  const sectHtml = sections.map(s => `
    <div style="margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:4px;height:20px;background:${s.color};border-radius:2px;flex-shrink:0"></div>
        <h4 style="font-size:15px;font-weight:700;margin:0">${s.title}</h4>
      </div>
      <ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
        ${s.items.map(i=>`<li style="font-size:13px;color:#374151;line-height:1.5">${i}</li>`).join('')}
      </ul>
    </div>`).join('')
  const html = `
    <div style="font-family:Inter,sans-serif;padding:0 4px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
        <span style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1px">LESSON PLAN</span>
        <span style="background:#f3f4f6;color:#374151;font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px">VSK 3.0</span>
      </div>
      <h1 style="font-size:22px;font-weight:700;margin:4px 0 4px">${topic}</h1>
      <p style="color:#666;font-size:13px;margin:0 0 16px">Grade ${grade} - ${subject} - ${TODAY} - 45 min</p>
      <div style="height:2px;background:#3d5afe;border-radius:1px;margin-bottom:20px"></div>
      ${sectHtml}
    </div>`
  return { title:'Lesson Plan', icon:'📋', html }
}

function buildPerformanceArtifact(ctx) {
  const grade = ctx.grade === 'All' ? '5' : (ctx.grade || '5')
  const d = PERF_DATA[grade] || PERF_DATA[5]
  const subjects = [
    { name:'Mathemat..', val:d.math, color:'#3d5afe' },
    { name:'Science',    val:d.sci,  color:'#3d5afe' },
    { name:'Gujarati',   val:d.guj,  color:'#3d5afe' },
  ]
  const maxH = 100
  const chartBars = subjects.map(s => {
    const h = Math.round((s.val / 100) * maxH)
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
      <span style="font-size:12px;font-weight:700;color:#374151">${s.val}%</span>
      <div style="width:100%;height:${h}px;background:${s.color};border-radius:4px 4px 0 0"></div>
      <span style="font-size:11px;color:#9ca3af;margin-top:4px">${s.name}</span>
    </div>`
  }).join('')
  const tableRows = d.students.map(s => `
    <tr>
      <td style="padding:10px 8px;font-size:13px;font-weight:500">${s.name}</td>
      <td style="padding:10px 8px;font-size:13px;text-align:center">${s.m}%</td>
      <td style="padding:10px 8px;font-size:13px;text-align:center">${s.s}%</td>
      <td style="padding:10px 8px;font-size:13px;text-align:center">${s.g}%</td>
      <td style="padding:10px 8px;text-align:center">${levelPill(s.lvl)}</td>
    </tr>`).join('')
  const html = `
    <div style="font-family:Inter,sans-serif;padding:0 4px">
      <h2 style="font-size:22px;font-weight:700;margin:0 0 4px">Class Performance</h2>
      <p style="color:#666;font-size:13px;margin:0 0 20px">${SCHOOL} - Grade ${ctx.grade === 'All' ? '5 (Sample)' : grade}</p>
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:16px">
        <h4 style="font-size:14px;font-weight:700;margin:0 0 16px">Subject Averages</h4>
        <div style="display:flex;gap:16px;align-items:flex-end;height:${maxH + 30}px">
          ${chartBars}
        </div>
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px">
        <h4 style="font-size:14px;font-weight:700;margin:0 0 12px">Student Details</h4>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:2px solid #f3f4f6">
              <th style="text-align:left;padding:8px;font-size:11px;color:#9ca3af;font-weight:700;letter-spacing:0.5px">STUDENT</th>
              <th style="padding:8px;font-size:11px;color:#9ca3af;font-weight:700">MATH</th>
              <th style="padding:8px;font-size:11px;color:#9ca3af;font-weight:700">SCI</th>
              <th style="padding:8px;font-size:11px;color:#9ca3af;font-weight:700">GUJ</th>
              <th style="padding:8px;font-size:11px;color:#9ca3af;font-weight:700">LEVEL</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </div>`
  return { title:'Performance', icon:'📊', html }
}

function buildReportCardArtifact(ctx) {
  const { grade='8', student='Ravi Parmar' } = ctx
  const d = PERF_DATA[grade] || PERF_DATA[8]
  const s = d.students[0]
  const html = `
    <div style="font-family:Inter,sans-serif;padding:0 4px">
      <div style="background:linear-gradient(135deg,#3d5afe,#1a237e);color:white;padding:20px;border-radius:12px;margin-bottom:16px">
        <div style="font-size:11px;font-weight:700;letter-spacing:1px;opacity:0.7">REPORT CARD · VSK 3.0</div>
        <div style="font-size:22px;font-weight:700;margin-top:4px">${student}</div>
        <div style="font-size:13px;opacity:0.8">Grade ${grade} · ${SCHOOL}</div>
        <div style="font-size:12px;opacity:0.6;margin-top:4px">Academic Year 2025–26</div>
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px">
        <h4 style="font-size:14px;font-weight:700;margin:0 0 12px">Subject Performance</h4>
        ${['Mathematics','Science','Gujarati','Social Science','English'].map((sub,i)=>{
          const score = [s?.m||78,s?.s||74,s?.g||70,72,68][i]
          const grade_ = score>=85?'A+':score>=75?'A':score>=60?'B+':score>=50?'B':'C'
          return `<div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid #f9fafb">
            <span style="flex:1;font-size:13px">${sub}</span>
            <span style="font-size:13px;font-weight:600;width:40px;text-align:right">${score}</span>
            <span style="margin-left:12px;width:28px;text-align:center;font-weight:700;font-size:13px;color:#3d5afe">${grade_}</span>
          </div>`
        }).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:11px;color:#9ca3af">Overall %</div>
          <div style="font-size:24px;font-weight:700;color:#3d5afe">${Math.round(((s?.m||78)+(s?.s||74)+(s?.g||70)+72+68)/5)}%</div>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:11px;color:#9ca3af">Grade</div>
          <div style="font-size:24px;font-weight:700;color:#16a34a">A</div>
        </div>
      </div>
    </div>`
  return { title:'Report Card', icon:'📄', html }
}

function buildScholarshipArtifact() {
  const schemes = SCHOLARSHIP_DATA || [
    { name:'Namo Laxmi Yojana', eligible:28, applied:24, approved:20, color:'#8b5cf6' },
    { name:'DBT Scholarship',   eligible:35, applied:30, approved:28, color:'#3d5afe' },
    { name:'EWS Admission',     eligible:12, applied:10, approved:9,  color:'#059669' },
  ]
  const html = `
    <div style="font-family:Inter,sans-serif;padding:0 4px">
      <h2 style="font-size:22px;font-weight:700;margin:0 0 4px">Scholarship Status</h2>
      <p style="color:#666;font-size:13px;margin:0 0 20px">${SCHOOL} · ${TODAY}</p>
      ${schemes.map(s=>`
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <h4 style="font-size:14px;font-weight:700;margin:0">${s.name}</h4>
            ${pill(Math.round(s.approved/s.eligible*100))}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">
            ${[['Eligible',s.eligible,'#374151'],['Applied',s.applied,'#3d5afe'],['Approved',s.approved,'#16a34a']].map(([l,v,c])=>`
              <div style="background:#f9fafb;border-radius:8px;padding:10px">
                <div style="font-size:11px;color:#9ca3af">${l}</div>
                <div style="font-size:20px;font-weight:700;color:${c}">${v}</div>
              </div>`).join('')}
          </div>
        </div>`).join('')}
    </div>`
  return { title:'Scholarships', icon:'🏅', html }
}

function buildAtRiskArtifact() {
  const students = AT_RISK_STUDENTS || []
  const high = students.filter(s => s.risk === 'high')
  const medium = students.filter(s => s.risk === 'medium')
  const riskColor = r => r === 'high' ? '#dc2626' : '#d97706'
  const riskBg = r => r === 'high' ? '#fee2e2' : '#fef3c7'
  const rows = students.map(s => `
    <div style="display:flex;align-items:center;padding:12px;border:1px solid #f3f4f6;border-radius:10px;margin-bottom:8px;gap:12px">
      <div style="flex:1">
        <div style="font-size:14px;font-weight:600;color:#111827">${s.name}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px">${s.reason || 'Low attendance'}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:12px;color:#6b7280">Att: <strong>${s.attendance}%</strong></div>
        <span style="background:${riskBg(s.risk)};color:${riskColor(s.risk)};font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px">${s.risk?.toUpperCase()}</span>
      </div>
    </div>`).join('')
  const html = `
    <div style="font-family:Inter,sans-serif;padding:0 4px">
      <h2 style="font-size:22px;font-weight:700;margin:0 0 4px">At-Risk Students</h2>
      <p style="color:#666;font-size:13px;margin:0 0 16px">${SCHOOL} · ${TODAY}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        <div style="border:1px solid #fee2e2;border-radius:12px;padding:14px;background:#fff5f5">
          <div style="font-size:11px;color:#dc2626;font-weight:700;margin-bottom:4px">HIGH RISK</div>
          <div style="font-size:28px;font-weight:700;color:#dc2626">${high.length}</div>
        </div>
        <div style="border:1px solid #fde68a;border-radius:12px;padding:14px;background:#fffbeb">
          <div style="font-size:11px;color:#d97706;font-weight:700;margin-bottom:4px">MEDIUM RISK</div>
          <div style="font-size:28px;font-weight:700;color:#d97706">${medium.length}</div>
        </div>
      </div>
      <div>${rows}</div>
      <button style="width:100%;margin-top:8px;padding:12px;background:#3d5afe;color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">
        📨 Send Parent Alerts for All High Risk
      </button>
    </div>`
  return { title:'At-Risk Students', icon:'⚠️', html }
}

function buildNamoLaxmiArtifact() {
  const apps = NAMO_LAXMI_APPS || []
  const statusColor = s => ({ approved:'#16a34a', pending:'#d97706', rejected:'#dc2626' })[s] || '#374151'
  const statusBg = s => ({ approved:'#dcfce7', pending:'#fef3c7', rejected:'#fee2e2' })[s] || '#f3f4f6'
  const rows = apps.map(a => `
    <div style="display:flex;align-items:center;padding:12px;border:1px solid #f3f4f6;border-radius:10px;margin-bottom:8px;gap:10px">
      <div style="flex:1">
        <div style="font-size:14px;font-weight:600">${a.name}</div>
        <div style="font-size:11px;color:#9ca3af">App ID: ${a.appId}</div>
        ${a.reason ? `<div style="font-size:11px;color:#ef4444;margin-top:2px">${a.reason}</div>` : ''}
      </div>
      <span style="background:${statusBg(a.status)};color:${statusColor(a.status)};font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:capitalize">${a.status}</span>
    </div>`).join('')
  const approved = apps.filter(a=>a.status==='approved').length
  const pending = apps.filter(a=>a.status==='pending').length
  const html = `
    <div style="font-family:Inter,sans-serif;padding:0 4px">
      <h2 style="font-size:22px;font-weight:700;margin:0 0 4px">Namo Laxmi Yojana</h2>
      <p style="color:#666;font-size:13px;margin:0 0 16px">${SCHOOL} · ${TODAY}</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
        ${[['Total',apps.length,'#374151'],['Approved',approved,'#16a34a'],['Pending',pending,'#d97706']].map(([l,v,c])=>`
          <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:11px;color:#9ca3af">${l}</div>
            <div style="font-size:22px;font-weight:700;color:${c}">${v}</div>
          </div>`).join('')}
      </div>
      <div>${rows}</div>
    </div>`
  return { title:'Namo Laxmi', icon:'🌸', html }
}

function buildDashboardArtifact(ctx) {
  const scope = ctx.scope || 'school'
  let kpis, title, subtitle, trendData
  if (scope === 'state') {
    const s = STATE_SUMMARY || {}
    kpis = [
      { label:'Total Schools',   val: s.totalSchools?.toLocaleString() || '33,248', color:'#3d5afe' },
      { label:'Total Students',  val: (s.totalStudents ? (s.totalStudents/1000000).toFixed(1)+'M' : '8.2M'), color:'#7c3aed' },
      { label:'Avg Attendance',  val: (s.avgAttendance||85.4)+'%', color:'#16a34a' },
      { label:'Scholarship Rate',val: (s.scholarshipRate||79.2)+'%', color:'#f97316' },
    ]
    title = 'State Dashboard — Gujarat'
    subtitle = `Ministry of Education · ${TODAY}`
    trendData = [82,84,83,86,85,87,88]
  } else if (scope === 'district') {
    const d = DISTRICTS?.[0] || {}
    kpis = [
      { label:'Total Schools',  val: d.schools?.toString() || '412',   color:'#3d5afe' },
      { label:'Total Students', val: d.students?.toLocaleString() || '24,831', color:'#7c3aed' },
      { label:'Avg Attendance', val: (d.attendance||84.2)+'%', color:'#16a34a' },
      { label:'Scheme Rate',    val: (d.scholarshipRate||78.6)+'%', color:'#f97316' },
    ]
    title = 'District Dashboard — Ahmedabad'
    subtitle = `District Education Office · ${TODAY}`
    trendData = [80,83,82,85,84,86,87]
  } else {
    kpis = [
      { label:'Total Students',   val:'342',   color:'#3d5afe' },
      { label:'Today Attendance', val:'88.3%', color:'#16a34a' },
      { label:'Avg Score',        val:'74.1%', color:'#f97316' },
      { label:'Scheme Rate',      val:'82.5%', color:'#8b5cf6' },
    ]
    title = 'School Dashboard'
    subtitle = `${SCHOOL} · ${TODAY}`
    trendData = [82,86,84,88,85,87,88]
  }
  const kpiHtml = kpis.map(k=>`
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px">
      <div style="font-size:11px;color:#9ca3af;margin-bottom:4px">${k.label}</div>
      <div style="font-size:24px;font-weight:700;color:${k.color}">${k.val}</div>
    </div>`).join('')
  const html = `
    <div style="font-family:Inter,sans-serif;padding:0 4px">
      <h2 style="font-size:22px;font-weight:700;margin:0 0 4px">${title}</h2>
      <p style="color:#666;font-size:13px;margin:0 0 20px">${subtitle}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">${kpiHtml}</div>
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px">
        <h4 style="font-size:14px;font-weight:700;margin:0 0 12px">Attendance Trend (Last 7 Days)</h4>
        <div style="display:flex;gap:8px;align-items:flex-end;height:80px">
          ${trendData.map((v,i)=>`
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
              <div style="width:100%;height:${Math.round(v*0.8)}px;background:${i===6?'#3d5afe':'#bfdbfe'};border-radius:3px 3px 0 0"></div>
              <span style="font-size:9px;color:#9ca3af">${['M','T','W','T','F','S','T'][i]}</span>
            </div>`).join('')}
        </div>
      </div>
      ${scope !== 'school' && DISTRICTS ? `
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-top:16px">
        <h4 style="font-size:14px;font-weight:700;margin:0 0 12px">${scope==='state'?'Top Districts':'Schools Snapshot'}</h4>
        ${(DISTRICTS||[]).slice(0,4).map(d=>`
          <div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid #f9fafb">
            <span style="flex:1;font-size:13px;font-weight:500">${d.name}</span>
            ${pill(d.attendance)}
          </div>`).join('')}
      </div>` : ''}
    </div>`
  return { title: scope === 'state' ? 'State Dashboard' : scope === 'district' ? 'District Dashboard' : 'School Dashboard', icon:'📊', html }
}

function buildLearningOutcomesArtifact() {
  const lo = LEARNING_OUTCOMES || {}
  const subjects = Object.keys(lo)
  const html = `
    <div style="font-family:Inter,sans-serif;padding:0 4px">
      <h2 style="font-size:22px;font-weight:700;margin:0 0 4px">Learning Outcomes</h2>
      <p style="color:#666;font-size:13px;margin:0 0 20px">${SCHOOL} · ${TODAY}</p>
      ${subjects.map(sub => `
        <div style="margin-bottom:20px">
          <h4 style="font-size:15px;font-weight:700;margin:0 0 10px;color:#1e3a5f">${sub}</h4>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
            <thead>
              <tr style="background:#f8fafc">
                <th style="text-align:left;padding:8px 10px;font-size:11px;color:#9ca3af;font-weight:700">OUTCOME</th>
                <th style="padding:8px;font-size:11px;color:#9ca3af;font-weight:700;text-align:center">GR 3</th>
                <th style="padding:8px;font-size:11px;color:#9ca3af;font-weight:700;text-align:center">GR 5</th>
                <th style="padding:8px;font-size:11px;color:#9ca3af;font-weight:700;text-align:center">GR 8</th>
              </tr>
            </thead>
            <tbody>
              ${(lo[sub]||[]).map(item=>`
                <tr style="border-top:1px solid #f3f4f6">
                  <td style="padding:9px 10px;font-size:12px;color:#374151">${item.outcome}</td>
                  <td style="padding:9px;text-align:center">${pill(item.grade3||0)}</td>
                  <td style="padding:9px;text-align:center">${pill(item.grade5||0)}</td>
                  <td style="padding:9px;text-align:center">${pill(item.grade8||0)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`).join('')}
    </div>`
  return { title:'Learning Outcomes', icon:'🎯', html }
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE CHAT CARDS (rendered inside message bubbles)
// ─────────────────────────────────────────────────────────────────────────────
function buildInlineAttendanceHtml(grade) {
  const students = STUDENTS[grade] || STUDENTS[8]
  return `
    <div style="margin-top:6px">
      <div style="font-size:12px;color:#666;margin-bottom:8px">
        <strong>${SCHOOL}</strong> — Grade ${grade} — ${TODAY}<br>
        Tap a name to toggle Present / Absent
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:10px" id="att-grid">
        ${students.map(s => {
          const short = s.name.split(' ').map(w => w[0] + w.slice(1,5)).join(' ')
          return `<div onclick="window._vskToggle(this)" data-n="${short}" data-status="present"
            style="padding:8px 4px;border-radius:8px;text-align:center;font-size:10px;font-weight:700;cursor:pointer;border:1px solid #C8E6C9;background:#E8F5E9;color:#2E7D32;user-select:none;transition:all .12s"
          >✓ ${short}</div>`
        }).join('')}
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#666;margin-bottom:6px">
        <span>Total: <strong>${students.length}</strong></span>
        <span id="att-summary">Present: <strong style="color:#2E7D32">${students.length}</strong> · Absent: <strong style="color:#E53935">0</strong></span>
      </div>
    </div>`
}

function buildInlineAtRiskHtml() {
  const students = AT_RISK_STUDENTS || []
  const rows = students.map(s => {
    const riskColor = s.risk === 'high' ? '#E53935' : '#FF8F00'
    const riskBg = s.risk === 'high' ? '#FFEBEE' : '#FFF8E1'
    return `<div style="display:flex;align-items:center;padding:8px 10px;border-bottom:1px solid #f3f4f6;gap:8px">
      <div style="flex:1;font-size:12px"><strong>${s.name}</strong><br><span style="color:#999;font-size:10px">${s.reason||'Low attendance'}</span></div>
      <span style="font-size:11px;color:#666">Att: <strong>${s.attendance}%</strong></span>
      <span style="background:${riskBg};color:${riskColor};font-size:9px;font-weight:700;padding:2px 7px;border-radius:12px">${(s.risk||'').toUpperCase()}</span>
    </div>`
  }).join('')
  const high = students.filter(s=>s.risk==='high').length
  return `
    <div style="margin-top:6px">
      <div style="font-size:12px;color:#666;margin-bottom:6px"><strong>⚠️ ${students.length} students at risk</strong> (${high} high risk)</div>
      <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">${rows}</div>
    </div>`
}

function buildInlineScholarshipHtml() {
  const schemes = SCHOLARSHIP_DATA || []
  return `
    <div style="margin-top:6px">
      ${schemes.map(s => {
        const pct = Math.round(s.approved / s.eligible * 100)
        const barColor = pct >= 80 ? '#4CAF50' : pct >= 60 ? '#FF9800' : '#E53935'
        return `<div style="background:#E3F2FD;border:1px solid rgba(30,136,229,.2);border-radius:10px;padding:10px 12px;margin-bottom:6px">
          <div style="font-size:11px;font-weight:700;color:#1E88E5;margin-bottom:6px">${s.name}</div>
          <div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid rgba(30,136,229,.1)">
            <span>Eligible</span><strong>${s.eligible}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid rgba(30,136,229,.1)">
            <span>Applied</span><strong>${s.applied}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0">
            <span>Approved</span><strong style="color:${barColor}">${s.approved} (${pct}%)</strong>
          </div>
        </div>`
      }).join('')}
    </div>`
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTIONS  (trigger chat flows)
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_ACTIONS = {
  teacher: [
    { icon: CalendarCheck, label: 'Mark\nAttendance',  bg: '#FFF8E1', fg: '#D97706', trigger: 'Task: attendance'        },
    { icon: BarChart3,     label: 'Class\nDashboard',  bg: '#EEF2FF', fg: '#4F46E5', trigger: 'Task: dashboard'          },
    { icon: ScanLine,      label: 'XAMTA\nScan',       bg: '#E8F5E9', fg: '#16A34A', trigger: 'XAMTA scan'               },
    { icon: Award,         label: 'Namo\nLaxmi',       bg: '#F3E5F5', fg: '#9333EA', trigger: 'Task: namo_laxmi'        },
    { icon: AlertTriangle, label: 'At-Risk\nStudents', bg: '#FEF2F2', fg: '#DC2626', trigger: 'Task: at_risk'           },
    { icon: MessageSquare, label: 'Parent\nAlert',     bg: '#E3F2FD', fg: '#1D4ED8', trigger: 'parent alert'             },
    { icon: FileText,      label: 'Generate\nReport',  bg: '#F0F4FF', fg: '#3730A3', trigger: 'Task: report_card'        },
    { icon: BookOpen,      label: 'Lesson\nPlan',      bg: '#E8F5E9', fg: '#059669', trigger: 'Task: lesson_plan'        },
  ],
  principal: [
    { icon: BarChart3,     label: 'School\nDashboard', bg: '#EEF2FF', fg: '#4F46E5', trigger: 'Task: dashboard'          },
    { icon: CalendarCheck, label: 'Attendance\nSummary', bg: '#FFF8E1', fg: '#D97706', trigger: 'Task: attendance'       },
    { icon: MessageSquare, label: 'Parent\nOutreach',  bg: '#F3E5F5', fg: '#9333EA', trigger: 'parent alert'             },
    { icon: AlertTriangle, label: 'War Room',          bg: '#FEF2F2', fg: '#DC2626', trigger: 'anomaly alerts'           },
    { icon: TrendingUp,    label: 'Class\nPerf.',      bg: '#E8F5E9', fg: '#16A34A', trigger: 'Task: class_performance'  },
    { icon: Award,         label: 'DBT\nStatus',       bg: '#FFF8E1', fg: '#D97706', trigger: 'Task: scholarship'        },
    { icon: FileText,      label: 'Generate\nPDF',     bg: '#E3F2FD', fg: '#1D4ED8', trigger: 'Task: report_card'        },
    { icon: AlertTriangle, label: 'At-Risk\nStudents', bg: '#FEF2F2', fg: '#DC2626', trigger: 'Task: at_risk'           },
  ],
  deo: [
    { icon: Building2,     label: 'District\nDash.',   bg: '#EEF2FF', fg: '#4F46E5', trigger: 'Task: district_dashboard' },
    { icon: Award,         label: 'DBT\nReport',       bg: '#FFF8E1', fg: '#D97706', trigger: 'Task: scholarship'        },
    { icon: AlertTriangle, label: 'War Room',          bg: '#FEF2F2', fg: '#DC2626', trigger: 'anomaly alerts'           },
    { icon: BarChart3,     label: 'Block\nAnalysis',   bg: '#E8F5E9', fg: '#16A34A', trigger: 'Task: class_performance'  },
    { icon: CalendarCheck, label: 'Att.\nSummary',     bg: '#F3E5F5', fg: '#9333EA', trigger: 'Task: attendance'         },
    { icon: GraduationCap, label: 'Learning\nOutcomes',bg: '#E3F2FD', fg: '#1D4ED8', trigger: 'Task: learning_outcomes'  },
    { icon: TrendingUp,    label: 'Critical\nAlerts',  bg: '#FEF2F2', fg: '#DC2626', trigger: 'anomaly alerts'           },
    { icon: FileText,      label: 'District\nReport',  bg: '#F0F4FF', fg: '#3730A3', trigger: 'Task: report_card'        },
  ],
  state_secretary: [
    { icon: Map,           label: 'State\nDashboard',  bg: '#EEF2FF', fg: '#4F46E5', trigger: 'Task: state_dashboard'    },
    { icon: Building2,     label: 'District\nDrilldown',bg: '#E8F5E9',fg: '#16A34A', trigger: 'Task: district_dashboard' },
    { icon: Award,         label: 'Scheme\nAnalytics', bg: '#F3E5F5', fg: '#9333EA', trigger: 'Task: namo_laxmi'        },
    { icon: AlertTriangle, label: 'War Room',          bg: '#FEF2F2', fg: '#DC2626', trigger: 'anomaly alerts'           },
    { icon: Brain,         label: 'Learning\nOutcomes',bg: '#E3F2FD', fg: '#1D4ED8', trigger: 'Task: learning_outcomes'  },
    { icon: TrendingUp,    label: 'Dropout\nRisk',     bg: '#FFF8E1', fg: '#D97706', trigger: 'Task: at_risk'           },
    { icon: BarChart3,     label: 'DBT\nDisbursal',    bg: '#E8F5E9', fg: '#059669', trigger: 'Task: scholarship'        },
    { icon: FileText,      label: 'Policy\nAdvisor',   bg: '#F0F4FF', fg: '#3730A3', trigger: 'policy advisor'           },
  ],
  parent: [
    { icon: CalendarCheck, label: "Ravi's\nAtt.",      bg: '#FFF8E1', fg: '#D97706', trigger: 'Task: attendance'         },
    { icon: Award,         label: 'Scholar\nship',     bg: '#F3E5F5', fg: '#9333EA', trigger: 'Task: scholarship'        },
    { icon: MessageSquare, label: 'Message\nTeacher',  bg: '#E3F2FD', fg: '#1D4ED8', trigger: 'parent alert'             },
    { icon: FileText,      label: 'Download\nReport',  bg: '#E8F5E9', fg: '#059669', trigger: 'Task: report_card'        },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATION ROUTER
// ─────────────────────────────────────────────────────────────────────────────
const TASK_FLOWS = {
  attendance: {
    triggers: ['attendance','mark attendance','mark','present','absent','task: attendance','task:attendance','haajri'],
    steps: [{ key:'grade', prompt:'Which grade?', opts:['3','5','6','8'] }],
    inline: true,
    progress: ['Fetching student roster...', 'Loading attendance records...', 'Building register...'],
    done: (ctx) => `📋 Attendance register for Grade ${ctx.grade||8} — ${TODAY}`,
    buildInline: (ctx) => buildInlineAttendanceHtml(ctx.grade || '8'),
    actions: [
      { label: '✅ Submit Attendance', trigger: '_submit_att', variant: 'ok' },
      { label: '📨 Notify parents', trigger: 'parent alert', variant: 'warn' },
      { label: '📊 View dashboard', trigger: 'Task: dashboard', variant: 'primary' },
    ],
  },
  at_risk: {
    triggers: ['at-risk','at risk','risk','task: at_risk','task:at_risk','dropout','struggling'],
    steps: [],
    inline: true,
    progress: ['Analyzing attendance patterns...', 'Calculating risk scores...', 'Identifying at-risk students...'],
    done: () => '⚠️ Here are the at-risk students for your school:',
    buildInline: () => buildInlineAtRiskHtml(),
    actions: [
      { label: '📨 Send parent alerts', trigger: 'parent alert', variant: 'err' },
      { label: '📈 Attendance plan', trigger: 'Task: attendance', variant: 'primary' },
    ],
  },
  lesson_plan: {
    triggers: ['lesson','lesson plan','lesson_plan','task: lesson_plan','task:lesson_plan','create lesson','make lesson'],
    steps: [
      { key:'subject', prompt:'Which subject?', opts:['Mathematics','Science','Gujarati'] },
      { key:'grade',   prompt:'Which grade?',   opts:['3','5','6','8'] },
      { key:'topic',   prompt:'What topic?' },
    ],
    progress: ['Analyzing curriculum...', 'Generating activities...', 'Building lesson plan...'],
    done: '📋 Your lesson plan is ready! Tap the card to view full details.',
    build: (ctx) => buildLessonPlanArtifact(ctx),
  },
  class_performance: {
    triggers: ['performance','class performance','class_performance','task: class_performance','task:class_performance','scores','grades','block analysis'],
    steps: [{ key:'grade', prompt:'Which grade?', opts:['All','3','5','6'] }],
    progress: ['Querying scores database...', 'Calculating averages...', 'Building dashboard...'],
    done: '📊 Performance dashboard ready. Tap the card to explore.',
    build: (ctx) => buildPerformanceArtifact(ctx),
  },
  report_card: {
    triggers: ['report card','report_card','task: report_card','task:report_card','generate report'],
    steps: [
      { key:'grade',   prompt:'Which grade?',   opts:['3','5','6','8'] },
      { key:'student', prompt:'Which student?', opts:['All Students','Ravi Parmar','Komal Patel','Ananya Pandya'] },
    ],
    progress: ['Fetching student data...', 'Generating report card...', 'Preparing PDF...'],
    done: '📄 Report card generated! Tap to view or download.',
    build: (ctx) => buildReportCardArtifact(ctx),
  },
  scholarship: {
    triggers: ['scholarship','dbt','ews','task: scholarship','task:scholarship','dbt status','dbt report','dbt disbursal'],
    steps: [],
    inline: true,
    progress: ['Loading scholarship records...', 'Checking disbursement status...'],
    done: () => `🏅 Scholarship status for ${SCHOOL}:`,
    buildInline: () => buildInlineScholarshipHtml(),
    actions: [
      { label: '📊 Full report', trigger: 'Task: dashboard', variant: 'primary' },
      { label: '🌸 Namo Laxmi', trigger: 'Task: namo_laxmi', variant: 'primary' },
    ],
  },
  namo_laxmi: {
    triggers: ['namo laxmi','namo_laxmi','task: namo_laxmi','task:namo_laxmi','scheme analytics'],
    steps: [],
    progress: ['Loading Namo Laxmi records...', 'Checking application statuses...', 'Building summary...'],
    done: '🌸 Namo Laxmi application status. Tap the card for full details.',
    build: () => buildNamoLaxmiArtifact(),
  },
  dashboard: {
    triggers: ['dashboard','school dashboard','task: dashboard','task:dashboard','kpi'],
    steps: [],
    progress: ['Connecting to school database...', 'Loading KPIs...', 'Building dashboard...'],
    done: '📊 School dashboard ready. Tap the card to explore.',
    build: () => buildDashboardArtifact({ scope:'school' }),
  },
  district_dashboard: {
    triggers: ['district dashboard','district_dashboard','task: district_dashboard','task:district_dashboard','district drilldown'],
    steps: [],
    progress: ['Aggregating district data...', 'Processing 412 schools...', 'Building overview...'],
    done: '📊 District dashboard ready. Tap the card to explore.',
    build: () => buildDashboardArtifact({ scope:'district' }),
  },
  state_dashboard: {
    triggers: ['state dashboard','state_dashboard','task: state_dashboard','task:state_dashboard','state kpi','state intelligence'],
    steps: [],
    progress: ['Connecting to state EMIS...', 'Aggregating 33 districts...', 'Processing 33,248 schools...', 'Building command center...'],
    done: '🏛️ State command center ready. Tap the card to explore.',
    build: () => buildDashboardArtifact({ scope:'state' }),
  },
  learning_outcomes: {
    triggers: ['learning outcomes','learning_outcomes','task: learning_outcomes','task:learning_outcomes','lo','outcomes'],
    steps: [],
    progress: ['Loading XAMTA results...', 'Analyzing learning outcomes...', 'Building report...'],
    done: '🎯 Learning outcomes report ready. Tap to view.',
    build: () => buildLearningOutcomesArtifact(),
  },
}

function detectTask(text) {
  const q = text.toLowerCase().trim()
  for (const [id, flow] of Object.entries(TASK_FLOWS)) {
    if (flow.triggers.some(t => q === t || q.includes(t))) return id
  }
  return null
}

function greetingReply(text, botName) {
  const q = text.toLowerCase().trim()
  const words = q.split(/\s+/)
  if (words.includes('hi') || words.includes('hello') || words.includes('namaste') ||
      q.includes('नमस्ते') || q === 'start demo') {
    return `Namaste! I'm ${botName}. How can I help you today?`
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function VSKSidebar({ onNew, activeSession, onSelect, role, userProfile, onClose }) {
  const meta = userProfile || ROLE_META[role] || ROLE_META.teacher
  const bots = ROLE_BOTS[role] || ROLE_BOTS.teacher || []
  const initial = (meta.name || 'U')[0].toUpperCase()
  return (
    <div className="flex flex-col h-full bg-white border-r border-bdr" style={{ width: 260 }}>
      {/* Logo + new */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-bdr-light">
        <div className="flex items-center gap-2">
          <img
            src="https://i.ibb.co/Xr1jqvd4/Logo-VSK-PNG.png"
            alt="VSK Gujarat"
            width={32}
            height={32}
            style={{ objectFit: 'contain', display: 'block' }}
            draggable={false}
          />
          <span className="font-bold text-[15px] text-txt-primary">VSK Gujarat</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onNew} className="w-7 h-7 rounded-lg flex items-center justify-center text-txt-secondary hover:bg-surface-secondary transition-colors">
            <Plus size={16} />
          </button>
          {onClose && (
            <button onClick={onClose} className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center text-txt-secondary hover:bg-surface-secondary">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 bg-surface-secondary rounded-lg px-3 py-2">
          <Search size={13} className="text-txt-tertiary flex-shrink-0" />
          <input className="flex-1 bg-transparent text-[13px] text-txt-primary outline-none placeholder-txt-tertiary" placeholder="Search chats..." />
        </div>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {Object.entries(CHAT_HISTORY).map(([section, items]) => (
          <div key={section} className="mb-2">
            <div className="px-2 py-1.5 text-[10px] font-bold text-txt-tertiary tracking-[0.8px]">{section}</div>
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => onSelect && onSelect(item)}
                className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                  activeSession === item
                    ? 'bg-surface-secondary text-txt-primary font-medium'
                    : 'text-txt-secondary hover:bg-surface-secondary'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* User footer */}
      <div className="border-t border-bdr-light px-3 py-3 flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[14px] flex-shrink-0"
          style={{ background: userProfile?.color || '#386AF6' }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-txt-primary truncate">{meta.name || meta.org}</div>
          <div className="text-[10px] text-txt-tertiary truncate">{meta.badge || meta.org}</div>
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-end mb-4">
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0">V</div>
      <div className="bg-surface-secondary rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0,1,2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-txt-tertiary animate-typing" style={{ animationDelay: `${i*0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

// Claude/ChatGPT-style streaming progress text
function ProgressText({ steps }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (idx < steps.length - 1) {
      const t = setTimeout(() => setIdx(i => i + 1), 900 + Math.random() * 500)
      return () => clearTimeout(t)
    }
  }, [idx, steps.length])
  return (
    <div className="flex gap-3 items-end mb-4">
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0">V</div>
      <div className="bg-surface-secondary rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-txt-secondary" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {steps[idx]}
          </span>
          <span className="inline-flex gap-1">
            {[0,1,2].map(i => (
              <span key={i} className="w-1 h-1 rounded-full bg-primary animate-typing" style={{ animationDelay: `${i*0.2}s` }} />
            ))}
          </span>
        </div>
      </div>
    </div>
  )
}

// Full-screen webview modal for expanded cards
function WebviewModal({ card, onClose }) {
  if (!card) return null
  const SESSION_TTL = 5 * 60 * 1000 // 5 minutes
  const isExpired = card.timestamp && (Date.now() - card.timestamp > SESSION_TTL)
  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-bdr flex-shrink-0" style={{ background: '#F8FAFC' }}>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-secondary">
          <ArrowLeft size={18} className="text-txt-primary" />
        </button>
        <span className="text-[18px]">{card.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-txt-primary truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>{card.title}</div>
          {card.subtitle && <div className="text-[11px] text-txt-secondary">{card.subtitle}</div>}
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-secondary">
          <X size={16} className="text-txt-tertiary" />
        </button>
      </div>
      {/* Content */}
      {isExpired ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <Clock size={48} className="text-txt-tertiary mb-4" />
          <h3 className="text-[18px] font-bold text-txt-primary mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Session Expired</h3>
          <p className="text-[13px] text-txt-secondary mb-6">This view has expired. Please run the task again for fresh data.</p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-white"
            style={{ background: '#386AF6', fontFamily: 'Montserrat, sans-serif' }}
          >Back to Chat</button>
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ fontFamily: 'Inter, sans-serif' }}
          dangerouslySetInnerHTML={{ __html: card.fullHtml || card.html || '' }}
        />
      )}
    </div>
  )
}

function MessageBubble({ msg, onChipClick, onAction, onCardClick }) {
  const isUser = msg.role === 'user'
  const ACTION_COLORS = {
    ok:   'border-[#4CAF50] text-[#4CAF50] active:bg-[#4CAF50]',
    err:  'border-[#E53935] text-[#E53935] active:bg-[#E53935]',
    warn: 'border-[#FF8F00] text-[#FF8F00] active:bg-[#FF8F00]',
    primary: 'border-primary text-primary active:bg-primary',
  }
  const hasWide = msg.html || msg.card
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'items-end'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0 self-end">V</div>
      )}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} ${hasWide ? 'max-w-[92%] md:max-w-[82%]' : 'max-w-[75%]'}`}>
        {/* Text bubble */}
        {msg.text && (
          <div className={`px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-line ${
            isUser ? 'text-white rounded-br-sm' : 'bg-[#F5F7FA] text-txt-primary rounded-bl-sm'
          }`} style={{ background: isUser ? '#386AF6' : undefined, fontFamily: 'Montserrat, sans-serif' }}>
            {msg.text}
          </div>
        )}
        {/* Expandable card bubble (click to open webview) */}
        {msg.card && (
          <div
            onClick={() => onCardClick?.(msg.card)}
            className="mt-2 bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow w-full"
            style={{ maxWidth: 380 }}
          >
            {msg.card.preview && (
              <div className="px-4 pt-3 pb-1" dangerouslySetInnerHTML={{ __html: msg.card.preview }} />
            )}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-[#F0F2F5]">
              <span className="text-[18px]">{msg.card.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-txt-primary" style={{ fontFamily: 'Montserrat, sans-serif' }}>{msg.card.title}</div>
                {msg.card.subtitle && <div className="text-[11px] text-txt-tertiary">{msg.card.subtitle}</div>}
              </div>
              <div className="flex items-center gap-1 text-primary text-[12px] font-semibold flex-shrink-0">
                <Eye size={14} /> Open
              </div>
            </div>
          </div>
        )}
        {/* Inline HTML card */}
        {msg.html && (
          <div className="mt-1.5 bg-white border border-[#E2E8F0] rounded-2xl px-4 py-3 text-txt-primary"
            dangerouslySetInnerHTML={{ __html: msg.html }} />
        )}
        {/* Action buttons */}
        {msg.actions?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {msg.actions.map((a, i) => (
              <button key={i}
                onClick={() => onAction ? onAction(a) : onChipClick(a.trigger)}
                className={`px-3.5 py-1.5 rounded-full border-[1.5px] text-[12px] font-bold bg-white transition-colors active:text-white ${ACTION_COLORS[a.variant] || ACTION_COLORS.primary}`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >{a.label}</button>
            ))}
          </div>
        )}
        {/* Chip options */}
        {msg.opts?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {msg.opts.map((opt, i) => (
              <button key={i} onClick={() => onChipClick(opt)}
                className="px-4 py-1.5 rounded-full border border-[#E2E8F0] text-[12.5px] text-txt-primary bg-white hover:bg-[#F5F7FA] transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >{opt}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function WelcomeScreen({ botName, onChip, role }) {
  const suggestions = ROLE_SUGGESTIONS[role] || ROLE_SUGGESTIONS.teacher || []
  const actions = QUICK_ACTIONS[role] || QUICK_ACTIONS.teacher
  const starters = ['Start Demo', 'नमस्ते']

  return (
    <div className="flex-1 flex flex-col items-center px-4 md:px-8 py-8 overflow-y-auto">

      {/* Hero */}
      <div className="flex flex-col items-center text-center mb-8 mt-4">
        <div className="mb-3">
          <img
            src="https://i.ibb.co/Xr1jqvd4/Logo-VSK-PNG.png"
            alt="VSK Gujarat"
            width={72}
            height={72}
            style={{ objectFit: 'contain', display: 'block' }}
            draggable={false}
          />
        </div>
        <h1 className="text-[26px] font-bold text-txt-primary mb-1.5">VSK 3.0</h1>
        <p className="text-[13px] text-txt-secondary max-w-[320px]">
          Gujarat's AI-Powered Education Governance Platform
        </p>
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {starters.map(s => (
            <button
              key={s}
              onClick={() => onChip(s)}
              className="px-4 py-1.5 rounded-full border border-bdr text-[13px] text-txt-primary bg-white hover:bg-surface-secondary transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="w-full max-w-[700px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-primary" />
            <span className="text-[13px] font-bold text-txt-primary">Quick Actions</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2.5 mb-6">
          {actions.map((item, i) => {
            const Icon = item.icon
            return (
              <button
                key={i}
                onClick={() => onChip(item.trigger)}
                className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl border border-bdr-light active:scale-95 transition-all duration-150 hover:shadow-card"
                style={{ background: item.bg }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: item.fg + '22' }}>
                  <Icon size={20} color={item.fg} strokeWidth={1.8} />
                </div>
                <span className="text-[11px] font-semibold text-txt-primary text-center leading-tight whitespace-pre-line">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Suggested prompts */}
        {suggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <MessageSquare size={13} className="text-txt-tertiary" />
              <span className="text-[12px] font-bold text-txt-secondary">Try asking...</span>
            </div>
            <div className="flex flex-col gap-2">
              {suggestions.slice(0, 4).map((s, i) => (
                <button
                  key={i}
                  onClick={() => onChip(s)}
                  className="text-left px-4 py-2.5 rounded-xl border border-bdr-light text-[13px] text-txt-secondary bg-white hover:bg-surface-secondary hover:text-txt-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InputBar({ onSend, disabled, activeBot }) {
  const [text, setText] = useState('')
  const taRef = useRef(null)
  const [focused, setFocused] = useState(false)

  const send = () => {
    const v = text.trim()
    if (!v || disabled) return
    onSend(v)
    setText('')
    if (taRef.current) taRef.current.style.height = 'auto'
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const autoResize = e => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
    setText(e.target.value)
  }

  return (
    <div className="px-4 pb-4 pt-2 flex-shrink-0">
      <div
        className={`rounded-2xl border transition-all ${
          focused ? 'border-primary shadow-[0_0_0_2px_rgba(56,106,246,0.15)]' : 'border-bdr'
        } bg-white`}
      >
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          onChange={autoResize}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={`Message ${activeBot || 'VSK Gujarat'}...`}
          className="w-full px-4 pt-3 pb-2 text-[14px] text-txt-primary bg-transparent outline-none resize-none placeholder-txt-tertiary leading-relaxed"
          style={{ minHeight: 44, maxHeight: 150 }}
        />
        <div className="flex items-center gap-2 px-3 pb-2.5">
          <div className="flex-1" />
          <button
            onClick={send}
            disabled={!text.trim() || disabled}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: text.trim() ? '#3d5afe' : '#e5e7eb' }}
          >
            <Send size={14} color={text.trim() ? '#fff' : '#9ca3af'} />
          </button>
        </div>
      </div>
      <p className="text-[11px] text-txt-tertiary text-center mt-1.5">VSK Gujarat can make mistakes. Please double-check responses.</p>
    </div>
  )
}

function ArtifactPanel({ artifact, onClose }) {
  if (!artifact) return null
  return (
    <div className="flex flex-col h-full border-l border-bdr bg-white" style={{ minWidth: 0 }}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-bdr flex-shrink-0">
        <span className="text-[18px]">{artifact.icon}</span>
        <span className="font-semibold text-[14px] text-txt-primary flex-1 truncate">{artifact.title}</span>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-bdr text-[12px] text-txt-secondary hover:bg-surface-secondary transition-colors">
          <Upload size={13} /> Share
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-bdr text-[12px] text-txt-secondary hover:bg-surface-secondary transition-colors">
          <Download size={13} /> Download
        </button>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-txt-tertiary hover:bg-surface-secondary transition-colors">
          <X size={15} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4" dangerouslySetInnerHTML={{ __html: artifact.html }} />
    </div>
  )
}

function ArtifactModal({ artifact, onClose }) {
  if (!artifact) return null
  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col animate-slide-in">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-bdr flex-shrink-0">
        <span className="text-[18px]">{artifact.icon}</span>
        <span className="font-semibold text-[14px] text-txt-primary flex-1 truncate">{artifact.title}</span>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-bdr text-[12px] text-txt-secondary">
          <Upload size={13} /> Share
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-bdr text-[12px] text-txt-secondary">
          <Download size={13} /> Download
        </button>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-txt-tertiary hover:bg-surface-secondary">
          <X size={15} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4" dangerouslySetInnerHTML={{ __html: artifact.html }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SuperHomePage() {
  const { role, userProfile } = useApp()
  const bots = ROLE_BOTS[role] || ROLE_BOTS.teacher || ['VSK 3.0']
  const [activeBot, setActiveBot]   = useState(bots[0])
  const [messages, setMessages]     = useState([])
  const [typing, setTyping]         = useState(false)
  const [collectState, setCollect]  = useState(null)
  const [artifact, setArtifact]     = useState(null)
  const [activeSession, setSession] = useState('VSK 3.0 Demo Session')
  const [sidebarOpen, setSidebar]   = useState(false)
  const [progressSteps, setProgress] = useState(null) // streaming progress text
  const [webviewCard, setWebview]    = useState(null)  // opened card for webview
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Reset active bot when role changes
  useEffect(() => {
    const newBots = ROLE_BOTS[role] || ['VSK 3.0']
    setActiveBot(newBots[0])
  }, [role])

  // Window globals for interactive inline cards
  useEffect(() => {
    window._vskToggle = (el) => {
      const isP = el.dataset.status === 'present'
      el.dataset.status = isP ? 'absent' : 'present'
      el.style.background = isP ? '#FFEBEE' : '#E8F5E9'
      el.style.borderColor = isP ? '#FFCDD2' : '#C8E6C9'
      el.style.color = isP ? '#E53935' : '#2E7D32'
      el.textContent = (isP ? '✗ ' : '✓ ') + el.dataset.n
      // Update summary
      const grid = el.closest('[id]')?.parentElement
      if (!grid) return
      const all = grid.querySelectorAll('[data-status]')
      const absent = [...all].filter(e => e.dataset.status === 'absent').length
      const summary = grid.querySelector('#att-summary')
      if (summary) summary.innerHTML = `Present: <strong style="color:#2E7D32">${all.length - absent}</strong> · Absent: <strong style="color:#E53935">${absent}</strong>`
    }
    window._vskSubmit = (btn) => {
      btn.textContent = '✅ Submitted'
      btn.style.background = '#4CAF50'
      btn.style.borderColor = '#4CAF50'
      btn.style.color = '#fff'
      btn.style.pointerEvents = 'none'
    }
    window._vskXamtaFile = (input) => {
      const file = input?.files?.[0]
      if (!file) return
      // Simulate scanning animation
      const scanDiv = document.createElement('div')
      scanDiv.id = 'xamta-scan-overlay'
      scanDiv.innerHTML = `<div style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:Montserrat,sans-serif">
        <div style="font-size:48px;margin-bottom:16px;animation:pulse 1s infinite">🔍</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:8px">Scanning ${file.name}...</div>
        <div style="font-size:12px;opacity:0.7">Detecting answer bubbles and evaluating responses</div>
        <div style="width:200px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;margin-top:16px;overflow:hidden">
          <div style="width:0;height:100%;background:#386AF6;border-radius:2px;animation:scanBar 3s forwards"></div>
        </div>
      </div>`
      document.body.appendChild(scanDiv)
      // Add animation keyframes
      const style = document.createElement('style')
      style.textContent = '@keyframes scanBar{0%{width:0}50%{width:60%}100%{width:100%}}'
      document.head.appendChild(style)
      setTimeout(() => { scanDiv.remove(); style.remove() }, 3000)
    }
    window._vskXamtaScan = () => {
      // On mobile, would open camera — for demo, simulate
      window._vskXamtaFile?.({ files: [{ name: 'camera_capture.jpg' }] })
    }
    return () => {
      delete window._vskToggle; delete window._vskSubmit
      delete window._vskXamtaFile; delete window._vskXamtaScan
    }
  }, [])

  const addBot = useCallback((text, opts = [], { html, actions, card, progress } = {}) => {
    const msg = { id: Date.now(), role:'bot', text, opts, html: html||null, actions: actions||null, card: card||null }
    if (progress?.length) {
      // Show streaming progress text, then deliver message
      setProgress(progress)
      const totalDelay = progress.length * 1100
      setTimeout(() => {
        setProgress(null)
        setMessages(prev => [...prev, msg])
      }, totalDelay)
    } else {
      setTyping(true)
      const delay = Math.min(250 + (text||'').length * 2, 800) + Math.random() * 200
      setTimeout(() => {
        setTyping(false)
        setMessages(prev => [...prev, msg])
      }, delay)
    }
  }, [])

  const openArtifact = useCallback((af) => setArtifact(af), [])

  const handleSend = useCallback((text) => {
    setMessages(prev => [...prev, { id: Date.now(), role:'user', text, opts:[] }])

    // ── Mid-collection flow ──────────────────────────────────────────────
    if (collectState) {
      const flow  = TASK_FLOWS[collectState.taskId]
      const step  = flow.steps[collectState.stepIdx]
      const newCtx = { ...collectState.ctx, [step.key]: text }
      const nextStep = collectState.stepIdx + 1

      if (nextStep < flow.steps.length) {
        const next = flow.steps[nextStep]
        setCollect({ taskId: collectState.taskId, stepIdx: nextStep, ctx: newCtx })
        addBot(next.prompt, next.opts || [])
      } else {
        setCollect(null)
        if (flow.inline && flow.buildInline) {
          const html = flow.buildInline(newCtx)
          const doneText = typeof flow.done === 'function' ? flow.done(newCtx) : flow.done
          addBot(doneText, [], { html, actions: flow.actions, progress: flow.progress })
        } else {
          const af = flow.build(newCtx)
          const doneText = typeof flow.done === 'function' ? flow.done(newCtx) : flow.done
          // Build an expandable card for the artifact
          const card = { title: af.title, icon: af.icon, subtitle: `${SCHOOL} · ${TODAY}`,
            preview: `<div style="font-size:11px;color:#666;max-height:60px;overflow:hidden">${(af.html||'').slice(0,200)}...</div>`,
            fullHtml: af.html, timestamp: Date.now() }
          addBot(doneText, [], { card, progress: flow.progress })
        }
      }
      return
    }

    // ── Greeting ─────────────────────────────────────────────────────────
    const gr = greetingReply(text, activeBot)
    if (gr) { addBot(gr); return }

    // ── Bot switch ────────────────────────────────────────────────────────
    const botMatch = bots.find(b => text.toLowerCase().includes(b.toLowerCase()) && b !== bots[0])
    if (botMatch) {
      setActiveBot(botMatch)
      addBot(`${botMatch} activated. How can I help you?`)
      return
    }

    // ── Task detection ────────────────────────────────────────────────────
    const taskId = detectTask(text)
    if (taskId) {
      const flow = TASK_FLOWS[taskId]
      if (flow.steps.length === 0) {
        if (flow.inline && flow.buildInline) {
          const html = flow.buildInline({})
          const doneText = typeof flow.done === 'function' ? flow.done({}) : flow.done
          addBot(doneText, [], { html, actions: flow.actions, progress: flow.progress })
        } else {
          const af = flow.build({})
          const doneText = typeof flow.done === 'function' ? flow.done({}) : flow.done
          const card = { title: af.title, icon: af.icon, subtitle: `${SCHOOL} · ${TODAY}`,
            preview: `<div style="font-size:11px;color:#666;max-height:60px;overflow:hidden">${(af.html||'').slice(0,200)}...</div>`,
            fullHtml: af.html, timestamp: Date.now() }
          addBot(doneText, [], { card, progress: flow.progress })
        }
      } else {
        setCollect({ taskId, stepIdx: 0, ctx: {} })
        const first = flow.steps[0]
        addBot(first.prompt, first.opts || [])
      }
      return
    }

    // ── Contextual shortcuts ──────────────────────────────────────────────
    const q = text.toLowerCase()

    if (q.includes('xamta') || q.includes('scan')) {
      const isMobile = window.innerWidth < 768
      const xamtaHtml = `
        <div style="margin-top:4px">
          <div style="font-size:12px;color:#666;margin-bottom:10px"><strong>XAMTA Assessment Scanner</strong> — Upload or scan answer sheets</div>
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <div onclick="document.getElementById('xamta-upload')?.click()" style="flex:1;background:#F5F7FA;border:2px dashed #386AF6;border-radius:12px;padding:14px;text-align:center;cursor:pointer">
              <div style="font-size:22px;margin-bottom:4px">📤</div>
              <div style="font-size:11px;font-weight:700;color:#386AF6">Upload Image/PDF</div>
            </div>
            ${isMobile ? `<div onclick="window._vskXamtaScan?.()" style="flex:1;background:#F5F7FA;border:2px dashed #16A34A;border-radius:12px;padding:14px;text-align:center;cursor:pointer">
              <div style="font-size:22px;margin-bottom:4px">📷</div>
              <div style="font-size:11px;font-weight:700;color:#16A34A">Open Camera</div>
            </div>` : ''}
          </div>
          <input type="file" id="xamta-upload" accept="image/*,.pdf" style="display:none" onchange="window._vskXamtaFile?.(this)" />
          <div style="font-size:10px;color:#999">Or enter marks manually using the form below</div>
        </div>`
      addBot('📷 XAMTA Assessment Scanner ready.', [], {
        html: xamtaHtml,
        actions: [
          { label: '📝 Enter marks by form', trigger: '_xamta_form', variant: 'primary' },
          { label: '📊 View past results', trigger: 'Task: learning_outcomes', variant: 'primary' },
        ],
        progress: ['Initializing XAMTA scanner...', 'Loading answer key templates...'],
      })
      return
    }
    if (q.includes('parent alert') || q.includes('parent connect') || q.includes('notify parent')) {
      addBot('📨 Parent alert system ready. Which class should receive the alert?',
        ['Class 6-A','Class 6-B','All classes'])
      return
    }
    if (q.includes('anomaly') || q.includes('war room')) {
      addBot('🔴 3 anomalies detected:\n• Daskroi: 72.1% attendance (below 75% threshold)\n• 142 schools flagged for follow-up\n• 2 data submission gaps\nWould you like the full dashboard?',
        ['Task: district_dashboard','Task: state_dashboard','Export report'])
      return
    }
    if (q.includes('student data') || q.includes('new enrollment') || q.includes('update records')) {
      addBot('📋 Student data entry ready. What would you like to update?',
        ['New enrollment','Update records','Scheme eligibility'])
      return
    }
    if (q.includes('remediation') || q.includes('remedial')) {
      addBot('🔧 Remediation plan generator ready. Which subject needs intervention?',
        ['Mathematics','Science','Gujarati'])
      return
    }
    if (q.includes('quiz') || q.includes('assessment')) {
      addBot('📝 Quiz builder ready. Which subject and grade?',
        ['Math - Grade 5','Science - Grade 6','Gujarati - Grade 8'])
      return
    }
    if (q.includes('brc') || q.includes('inspection') || q.includes('visit')) {
      addBot('📋 BRC/CRC visit checklist ready. Would you like to generate an inspection report?',
        ['Generate checklist','Log visit notes','View previous visits'])
      return
    }
    if (q.includes('policy') || q.includes('policy advisor')) {
      addBot('📜 Policy Advisor ready. I can help analyze education schemes, compliance requirements, or draft policy briefs. What do you need?',
        ['Scheme compliance','Draft policy brief','Regulatory update'])
      return
    }
    if (q.includes('message teacher') || q.includes('contact teacher')) {
      addBot(`📩 Message sent to ${SCHOOL_INFO?.name || 'the school'} teacher. You'll receive a reply within 24 hours.`)
      return
    }

    // ── Fallback ──────────────────────────────────────────────────────────
    const fallbackOpts = {
      teacher:         ['Task: attendance','Task: lesson_plan','Task: at_risk'],
      principal:       ['Task: dashboard','Task: at_risk','anomaly alerts'],
      deo:             ['Task: district_dashboard','Task: learning_outcomes','anomaly alerts'],
      state_secretary: ['Task: state_dashboard','Task: namo_laxmi','Task: learning_outcomes'],
      parent:          ['Task: attendance','Task: scholarship','Task: report_card'],
    }
    addBot(
      "I can help with attendance, lesson plans, performance analysis, scholarships, and dashboards. Try typing one of those, or tap a Quick Action.",
      fallbackOpts[role] || fallbackOpts.teacher
    )
  }, [collectState, activeBot, bots, addBot, openArtifact, role])

  const handleNew = () => {
    setMessages([])
    setCollect(null)
    setArtifact(null)
    setSession('New Chat')
    setSidebar(false)
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-full overflow-hidden bg-white">

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="md:hidden absolute inset-0 z-30 bg-black/40" onClick={() => setSidebar(false)} />
      )}
      <div className={`
        md:flex flex-shrink-0 h-full z-40
        absolute md:relative
        transition-transform duration-300
        ${sidebarOpen ? 'flex translate-x-0' : 'hidden -translate-x-full md:translate-x-0'}
      `}>
        <VSKSidebar
          onNew={handleNew}
          activeSession={activeSession}
          onSelect={s => { setSession(s); setSidebar(false) }}
          role={role}
          userProfile={userProfile}
          onClose={() => setSidebar(false)}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-bdr flex-shrink-0">
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-txt-secondary hover:bg-surface-secondary"
            onClick={() => setSidebar(true)}
          >
            <Menu size={18} />
          </button>

          <span className="text-[14px] font-semibold text-txt-primary">VSK Gujarat</span>

          <div className="flex-1" />
        </div>

        {/* Chat + artifact split */}
        <div className="flex-1 flex min-h-0">

          {/* Message list */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 pt-4">
              {!hasMessages ? (
                <WelcomeScreen botName={activeBot} onChip={handleSend} role={role} />
              ) : (
                <>
                  {messages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      onChipClick={handleSend}
                      onCardClick={(card) => setWebview(card)}
                      onAction={(a) => {
                        if (a.trigger === '_submit_att') {
                          addBot('✅ Attendance submitted successfully! Parent alerts queued for 5:00 PM.', [], {
                            progress: ['Saving attendance records...', 'Queuing parent SMS alerts...', 'Done!'],
                            actions: [
                              { label: '📊 View dashboard', trigger: 'Task: dashboard', variant: 'primary' },
                              { label: '📨 Send alerts now', trigger: 'parent alert', variant: 'warn' },
                            ]
                          })
                        } else if (a.trigger === '_xamta_form') {
                          const results = XAMTA_SAMPLE_RESULTS || []
                          const rows = results.map(r => `<div style="display:flex;align-items:center;padding:8px;border-bottom:1px solid #f0f0f0;gap:8px">
                            <div style="flex:1;font-size:12px"><strong>${r.student}</strong><br><span style="color:#999;font-size:10px">Grade ${r.grade} · ${r.subject}</span></div>
                            <span style="font-size:13px;font-weight:700;color:${r.score/r.total>=0.7?'#16a34a':'#dc2626'}">${r.score}/${r.total}</span>
                          </div>`).join('')
                          addBot('📊 XAMTA scan results processed:', [], {
                            html: `<div style="margin-top:4px"><div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">${rows}</div></div>`,
                            progress: ['Processing scanned sheets...', 'Matching answer keys...', 'Calculating LO scores...'],
                            actions: [
                              { label: '📥 Save results', trigger: '_save_xamta', variant: 'ok' },
                              { label: '📊 View outcomes', trigger: 'Task: learning_outcomes', variant: 'primary' },
                            ]
                          })
                        } else {
                          handleSend(a.trigger)
                        }
                      }}
                    />
                  ))}
                  {typing && <TypingIndicator />}
                  {progressSteps && <ProgressText steps={progressSteps} />}
                  <div ref={bottomRef} />
                </>
              )}
            </div>
            <InputBar onSend={handleSend} disabled={typing || !!progressSteps} activeBot={activeBot} />
          </div>

          {/* Artifact panel — desktop inline */}
          {artifact && (
            <div className="hidden md:flex flex-col" style={{ width:'46%', maxWidth:520, minWidth:320 }}>
              <ArtifactPanel artifact={artifact} onClose={() => setArtifact(null)} />
            </div>
          )}
        </div>
      </div>

      {/* Artifact modal — mobile */}
      {artifact && <ArtifactModal artifact={artifact} onClose={() => setArtifact(null)} />}

      {/* Webview modal — for expanded card bubbles */}
      {webviewCard && <WebviewModal card={webviewCard} onClose={() => setWebview(null)} />}
    </div>
  )
}
