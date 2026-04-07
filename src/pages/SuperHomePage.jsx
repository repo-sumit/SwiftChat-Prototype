import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Plus, Search, Sun, Moon, Upload, Paperclip, Send,
  Download, X, Menu, ChevronDown, Monitor, Sparkles,
  CalendarCheck, BarChart3, ScanLine, Award, AlertTriangle,
  MessageSquare, FileText, UserRound, BookOpen, GraduationCap,
  TrendingUp, Building2,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Logo from '../components/Logo'

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
const SCHOOL = 'Sardar Patel Prathmik Shala'

const STUDENTS = {
  3:  [{ id:'STU-00101',name:'Aarav Shah' },{ id:'STU-00102',name:'Diya Patel' },{ id:'STU-00103',name:'Rohan Mehta' },{ id:'STU-00104',name:'Priya Joshi' },{ id:'STU-00105',name:'Kiran Desai' },{ id:'STU-00106',name:'Mira Thakor' }],
  5:  [{ id:'STU-00201',name:'Pranav Desai' },{ id:'STU-00202',name:'Khushi Goel' },{ id:'STU-00203',name:'Charmi Desai' },{ id:'STU-00204',name:'Tanvi Jadeja' },{ id:'STU-00205',name:'Manan Patel' },{ id:'STU-00206',name:'Sneha Rathod' }],
  6:  [{ id:'STU-00301',name:'Ravi Parmar' },{ id:'STU-00302',name:'Komal Patel' },{ id:'STU-00303',name:'Isha Jadeja' },{ id:'STU-00304',name:'Aryan Shah' },{ id:'STU-00305',name:'Nisha Thakor' },{ id:'STU-00306',name:'Dev Solanki' }],
  8:  [{ id:'STU-00006',name:'Ravi Parmar' },{ id:'STU-00010',name:'Laksh Rathod' },{ id:'STU-00012',name:'Bhumi Patel' },{ id:'STU-00015',name:'Ananya Pandya' },{ id:'STU-00019',name:'Isha Jadeja' },{ id:'STU-00025',name:'Nisha Thakor' },{ id:'STU-00033',name:'Viraj Joshi' },{ id:'STU-00042',name:'Urvi Desai' },{ id:'STU-00048',name:'Ananya Sharma' },{ id:'STU-00050',name:'Isha Patel' }],
}

const PERF_DATA = {
  3:  { math:72.1, sci:68.4, guj:65.3, students:[{ name:'Aarav Shah',m:80,s:72,g:68,lvl:'Proficient' },{ name:'Diya Patel',m:65,s:60,g:58,lvl:'Basic' },{ name:'Rohan Mehta',m:70,s:75,g:70,lvl:'Proficient' },{ name:'Priya Joshi',m:90,s:88,g:85,lvl:'Advanced' }] },
  5:  { math:68.4, sci:69.2, guj:50.8, students:[{ name:'Pranav Desai',m:56,s:58,g:68,lvl:'Proficient' },{ name:'Khushi Goel',m:70,s:84,g:32,lvl:'Proficient' },{ name:'Charmi Desai',m:96,s:76,g:56,lvl:'Proficient' },{ name:'Tanvi Jadeja',m:44,s:82,g:58,lvl:'Proficient' },{ name:'Manan Patel',m:76,s:46,g:40,lvl:'Basic' }] },
  6:  { math:75.0, sci:72.5, guj:68.0, students:[{ name:'Ravi Parmar',m:78,s:74,g:70,lvl:'Proficient' },{ name:'Komal Patel',m:62,s:65,g:60,lvl:'Basic' },{ name:'Isha Jadeja',m:88,s:85,g:80,lvl:'Advanced' }] },
  8:  { math:80.2, sci:77.4, guj:72.1, students:[{ name:'Ravi Parmar',m:85,s:78,g:74,lvl:'Advanced' },{ name:'Laksh Rathod',m:72,s:80,g:68,lvl:'Proficient' },{ name:'Bhumi Patel',m:90,s:88,g:82,lvl:'Advanced' }] },
}

const CHAT_HISTORY = {
  TODAY:    ['VSK 3.0 Demo Session','Block attendance review','Grade 6 lesson planning'],
  YESTERDAY:['District quarterly report','Scholarship coverage analysis'],
  'PREVIOUS 7 DAYS':['State KPI dashboard','Inspection readiness check'],
}

const BOTS = {
  teacher:   ['VSK 3.0 Main','Shikshak Sahayak','Assessment Bot','Remediation Bot'],
  principal: ['VSK 3.0 Main','School Monitor','Compliance Bot','Parent Connect'],
  deo:       ['VSK 3.0 Main','District Analyst','Report Generator','Intervention Bot'],
  parent:    ['VSK 3.0 Main','Parent Assistant'],
}

const ROLE_META = {
  teacher:   { name:'Ms. Priya',   org:'Gujarat Education', badge:'Teacher'   },
  principal: { name:'Mr. Rajesh',  org:'GPS Mehsana',        badge:'Principal' },
  deo:       { name:'Mr. Amit',    org:'Ahmedabad District', badge:'DEO'       },
  parent:    { name:'Suresh',      org:'Parent Portal',      badge:'Parent'    },
}

const TODAY = new Date().toLocaleDateString('en-GB',{ day:'2-digit',month:'2-digit',year:'numeric' }).replace(/\//g,'/')

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
function bar(pct, color='#3d5afe') {
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1">
    <span style="font-size:12px;color:#666;font-weight:600">${pct}%</span>
    <div style="width:100%;height:${Math.round(pct*1.2)}px;background:${color};border-radius:4px 4px 0 0"></div>
  </div>`
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
  const barHtml = `
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:16px">
      <h4 style="font-size:14px;font-weight:700;margin:0 0 16px">Subject Averages</h4>
      <div style="display:flex;gap:16px;align-items:flex-end;height:140px;padding:0 8px">
        ${subjects.map(s=>`
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end">
            <span style="font-size:12px;font-weight:600;color:#374151">${s.val}%</span>
            <div style="width:100%;background:${s.color};border-radius:4px 4px 0 0" style="height:${Math.round(s.val)}px"></div>
            <div style="width:100%;height:${Math.round(s.val * 1.0)}px;background:${s.color};border-radius:4px 4px 0 0;min-height:20px"></div>
            <span style="font-size:11px;color:#9ca3af;text-align:center">${s.name}</span>
          </div>`).join('')}
      </div>
    </div>`
  // Better bar chart with fixed heights
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

function buildScholarshipArtifact(ctx) {
  const html = `
    <div style="font-family:Inter,sans-serif;padding:0 4px">
      <h2 style="font-size:22px;font-weight:700;margin:0 0 4px">Scholarship Status</h2>
      <p style="color:#666;font-size:13px;margin:0 0 20px">${SCHOOL} · ${TODAY}</p>
      ${[
        { name:'Namo Laxmi Yojana', eligible:28, applied:24, approved:20, color:'#8b5cf6' },
        { name:'DBT Scholarship',   eligible:35, applied:30, approved:28, color:'#3d5afe' },
        { name:'EWS Admission',     eligible:12, applied:10, approved:9,  color:'#059669' },
      ].map(s=>`
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

function buildDashboardArtifact(ctx) {
  const scope = ctx.scope || 'school'
  const kpis = scope === 'district'
    ? [{ label:'Total Students',val:'24,831',color:'#3d5afe' },{ label:'Avg Attendance',val:'84.2%',color:'#16a34a' },{ label:'Avg Score',val:'71.4%',color:'#f97316' },{ label:'Scheme Rate',val:'78.6%',color:'#8b5cf6' }]
    : [{ label:'Total Students',val:'342',color:'#3d5afe' },{ label:'Today Attendance',val:'88.3%',color:'#16a34a' },{ label:'Avg Score',val:'74.1%',color:'#f97316' },{ label:'Scheme Rate',val:'82.5%',color:'#8b5cf6' }]
  const kpiHtml = kpis.map(k=>`
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px">
      <div style="font-size:11px;color:#9ca3af;margin-bottom:4px">${k.label}</div>
      <div style="font-size:24px;font-weight:700;color:${k.color}">${k.val}</div>
    </div>`).join('')
  const html = `
    <div style="font-family:Inter,sans-serif;padding:0 4px">
      <h2 style="font-size:22px;font-weight:700;margin:0 0 4px">${scope==='district'?'District':'School'} Dashboard</h2>
      <p style="color:#666;font-size:13px;margin:0 0 20px">${scope==='district'?'Ahmedabad District':SCHOOL} · ${TODAY}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">${kpiHtml}</div>
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px">
        <h4 style="font-size:14px;font-weight:700;margin:0 0 12px">Attendance Trend (Last 7 Days)</h4>
        <div style="display:flex;gap:8px;align-items:flex-end;height:80px">
          ${[82,86,84,88,85,87,88].map((v,i)=>`
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
              <div style="width:100%;height:${Math.round(v*0.8)}px;background:${i===6?'#3d5afe':'#bfdbfe'};border-radius:3px 3px 0 0"></div>
              <span style="font-size:9px;color:#9ca3af">${['M','T','W','T','F','S','T'][i]}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`
  return { title:'Dashboard', icon:'📊', html }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTIONS  (trigger chat flows)
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_ACTIONS = {
  teacher: [
    { icon: CalendarCheck, label: 'Mark\nAttendance',  bg: '#FFF8E1', fg: '#D97706', trigger: 'Task: attendance'        },
    { icon: BarChart3,     label: 'Class\nDashboard',  bg: '#EEF2FF', fg: '#4F46E5', trigger: 'Task: dashboard'          },
    { icon: ScanLine,      label: 'XAMTA\nScan',       bg: '#E8F5E9', fg: '#16A34A', trigger: 'XAMTA scan'               },
    { icon: Award,         label: 'Namo\nLaxmi',       bg: '#F3E5F5', fg: '#9333EA', trigger: 'Task: scholarship'        },
    { icon: AlertTriangle, label: 'At-Risk\nStudents', bg: '#FEF2F2', fg: '#DC2626', trigger: 'at-risk students'         },
    { icon: MessageSquare, label: 'Parent\nAlert',     bg: '#E3F2FD', fg: '#1D4ED8', trigger: 'parent alert'             },
    { icon: FileText,      label: 'Generate\nReport',  bg: '#F0F4FF', fg: '#3730A3', trigger: 'Task: report_card'        },
    { icon: UserRound,     label: 'Student\nData',     bg: '#E8F5E9', fg: '#059669', trigger: 'student data'             },
  ],
  principal: [
    { icon: BarChart3,     label: 'School\nDashboard', bg: '#EEF2FF', fg: '#4F46E5', trigger: 'Task: dashboard'          },
    { icon: CalendarCheck, label: 'Attendance\nSummary', bg: '#FFF8E1', fg: '#D97706', trigger: 'Task: attendance'       },
    { icon: MessageSquare, label: 'Parent\nOutreach',  bg: '#F3E5F5', fg: '#9333EA', trigger: 'parent alert'             },
    { icon: AlertTriangle, label: 'War Room',          bg: '#FEF2F2', fg: '#DC2626', trigger: 'anomaly alerts'           },
    { icon: TrendingUp,    label: 'Class\nPerf.',      bg: '#E8F5E9', fg: '#16A34A', trigger: 'Task: class_performance'  },
    { icon: Award,         label: 'DBT\nStatus',       bg: '#FFF8E1', fg: '#D97706', trigger: 'Task: scholarship'        },
    { icon: FileText,      label: 'Generate\nPDF',     bg: '#E3F2FD', fg: '#1D4ED8', trigger: 'Task: report_card'        },
    { icon: BookOpen,      label: 'Lesson\nPlan',      bg: '#F0F4FF', fg: '#3730A3', trigger: 'Task: lesson_plan'        },
  ],
  deo: [
    { icon: Building2,     label: 'District\nDash.',   bg: '#EEF2FF', fg: '#4F46E5', trigger: 'Task: dashboard'          },
    { icon: Award,         label: 'DBT\nReport',       bg: '#FFF8E1', fg: '#D97706', trigger: 'Task: scholarship'        },
    { icon: AlertTriangle, label: 'War Room',          bg: '#FEF2F2', fg: '#DC2626', trigger: 'anomaly alerts'           },
    { icon: BarChart3,     label: 'Block\nAnalysis',   bg: '#E8F5E9', fg: '#16A34A', trigger: 'Task: class_performance'  },
    { icon: CalendarCheck, label: 'Att.\nSummary',     bg: '#F3E5F5', fg: '#9333EA', trigger: 'Task: attendance'         },
    { icon: FileText,      label: 'District\nReport',  bg: '#F0F4FF', fg: '#3730A3', trigger: 'Task: report_card'        },
    { icon: TrendingUp,    label: 'Critical\nAlerts',  bg: '#FEF2F2', fg: '#DC2626', trigger: 'anomaly alerts'           },
    { icon: GraduationCap, label: 'VSK\nIntelligence', bg: '#E3F2FD', fg: '#1D4ED8', trigger: 'Task: dashboard'          },
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
    triggers: ['attendance','mark attendance','mark','present','absent','task: attendance','task:attendance'],
    steps: [{ key:'grade', prompt:'Which grade?', opts:['3','5','6','8'] }],
    done: 'Attendance marked! You can share or download the register from the panel.',
    build: buildAttendanceArtifact,
  },
  lesson_plan: {
    triggers: ['lesson','lesson plan','lesson_plan','task: lesson_plan','task:lesson_plan','create lesson','make lesson'],
    steps: [
      { key:'subject', prompt:'Which subject?', opts:['Mathematics','Science','Gujarati'] },
      { key:'grade',   prompt:'Which grade?',   opts:['3','5','6','8'] },
      { key:'topic',   prompt:'What topic?' },
    ],
    done: 'Your lesson plan is ready. You can share or download it from the panel. What would you like to do next?',
    build: buildLessonPlanArtifact,
  },
  class_performance: {
    triggers: ['performance','class performance','class_performance','task: class_performance','task:class_performance','scores','grades'],
    steps: [{ key:'grade', prompt:'Which grade?', opts:['All','3','5','6'] }],
    done: 'Your dashboard is ready. What would you like to do next?',
    build: buildPerformanceArtifact,
  },
  report_card: {
    triggers: ['report card','report_card','task: report_card','task:report_card','generate report'],
    steps: [
      { key:'grade',   prompt:'Which grade?',   opts:['3','5','6','8'] },
      { key:'student', prompt:'Which student?', opts:['All Students','Ravi Parmar','Komal Patel','Ananya Pandya'] },
    ],
    done: 'Report card generated! You can share or download from the panel.',
    build: buildReportCardArtifact,
  },
  scholarship: {
    triggers: ['scholarship','namo laxmi','dbt','ews','task: scholarship','task:scholarship'],
    steps: [],
    done: 'Scholarship status loaded. View the panel for details.',
    build: buildScholarshipArtifact,
  },
  dashboard: {
    triggers: ['dashboard','school dashboard','district dashboard','kpi','task: dashboard','task:dashboard'],
    steps: [],
    done: 'Dashboard ready. View the panel for full details.',
    build: buildDashboardArtifact,
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
  const q = text.toLowerCase()
  if (q.includes('namaste') || q.includes('नमस्ते') || q.includes('hello') || q.includes('hi') || q === 'start demo') {
    return `Namaste! I'm ${botName}. How can I help you today?`
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function VSKSidebar({ onNew, activeSession, onSelect, role, onClose }) {
  const meta = ROLE_META[role] || ROLE_META.teacher
  const bots  = BOTS[role] || BOTS.teacher
  const initial = meta.name[0].toUpperCase()
  return (
    <div className="flex flex-col h-full bg-white border-r border-bdr" style={{ width: 260 }}>
      {/* Logo + new */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-bdr-light">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Logo size={18} />
          </div>
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
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[14px] flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-txt-primary truncate">{meta.org}</div>
        </div>
        <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">PRO</span>
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

function MessageBubble({ msg, onChipClick }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'items-end'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0 self-end">V</div>
      )}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-surface-secondary text-txt-primary rounded-bl-sm'
        }`}>
          {msg.text}
        </div>
        {msg.opts?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {msg.opts.map((opt, i) => (
              <button
                key={i}
                onClick={() => onChipClick(opt)}
                className="px-4 py-1.5 rounded-full border border-bdr text-[13px] text-txt-primary bg-white hover:bg-surface-secondary active:bg-bdr transition-colors"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function WelcomeScreen({ botName, onChip, role }) {
  const starters = ['Start Demo', 'नमस्ते', 'नम्स्ते']
  const actions = QUICK_ACTIONS[role] || QUICK_ACTIONS.teacher

  return (
    <div className="flex-1 flex flex-col items-center px-4 md:px-8 py-8 overflow-y-auto">

      {/* Hero */}
      <div className="flex flex-col items-center text-center mb-8 mt-4">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-modal">
          <Logo size={28} />
        </div>
        <h1 className="text-[26px] font-bold text-txt-primary mb-1.5">VSK 3.0</h1>
        <p className="text-[13px] text-txt-secondary max-w-[320px]">
          Gujarat's AI-Powered Education Governance Platform
        </p>
        {/* Greeting chips */}
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
          <button className="text-[12px] text-primary font-semibold">See all</button>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {actions.map((item, i) => {
            const Icon = item.icon
            return (
              <button
                key={i}
                onClick={() => onChip(item.trigger)}
                className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl border border-bdr-light active:scale-95 transition-all duration-150 hover:shadow-card"
                style={{ background: item.bg }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: item.fg + '22' }}
                >
                  <Icon size={20} color={item.fg} strokeWidth={1.8} />
                </div>
                <span className="text-[11px] font-semibold text-txt-primary text-center leading-tight whitespace-pre-line">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function InputBar({ onSend, disabled }) {
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
          placeholder="Message VSK Gujarat..."
          className="w-full px-4 pt-3 pb-2 text-[14px] text-txt-primary bg-transparent outline-none resize-none placeholder-txt-tertiary leading-relaxed"
          style={{ minHeight: 44, maxHeight: 150 }}
        />
        <div className="flex items-center gap-2 px-3 pb-2.5">
          <button className="flex items-center justify-center w-8 h-8 rounded-lg text-txt-tertiary hover:bg-surface-secondary transition-colors">
            <Paperclip size={16} />
          </button>
          <button className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-txt-tertiary hover:bg-surface-secondary transition-colors text-[13px]">
            <Search size={14} /> Search
          </button>
          <button className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-txt-tertiary hover:bg-surface-secondary transition-colors text-[13px]">
            <Monitor size={14} /> Bot <ChevronDown size={11} />
          </button>
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
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-bdr flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0">V</div>
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
      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4"
        dangerouslySetInnerHTML={{ __html: artifact.html }}
      />
    </div>
  )
}

// Full-screen artifact modal (for mobile)
function ArtifactModal({ artifact, onClose }) {
  if (!artifact) return null
  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col animate-slide-in">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-bdr flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0">V</div>
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
  const { role } = useApp()
  const bots = BOTS[role] || BOTS.teacher
  const [activeBot, setActiveBot]   = useState(bots[0])
  const [messages, setMessages]     = useState([])
  const [typing, setTyping]         = useState(false)
  const [collectState, setCollect]  = useState(null) // { taskId, stepIdx, ctx }
  const [artifact, setArtifact]     = useState(null) // { title, html }
  const [activeSession, setSession] = useState('VSK 3.0 Demo Session')
  const [sidebarOpen, setSidebar]   = useState(false)
  const [darkMode, setDark]         = useState(false)
  const [showBotDrop, setBotDrop]   = useState(false)
  const bottomRef = useRef(null)

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const addBot = useCallback((text, opts = []) => {
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages(prev => [...prev, { id: Date.now(), role:'bot', text, opts }])
    }, 600 + Math.random() * 400)
  }, [])

  const openArtifact = useCallback((af) => {
    setArtifact(af)
  }, [])

  // ── Conversation handler ────────────────────────────────────────────────
  const handleSend = useCallback((text) => {
    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), role:'user', text, opts:[] }])

    // ── If we're mid-collection ──────────────────────────────────────────
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
        // All steps done — build artifact
        setCollect(null)
        const af = flow.build(newCtx)
        openArtifact(af)
        addBot(flow.done)
      }
      return
    }

    // ── Greeting ────────────────────────────────────────────────────────
    const gr = greetingReply(text, activeBot)
    if (gr) { addBot(gr); return }

    // ── Bot switch ──────────────────────────────────────────────────────
    const botMatch = bots.find(b => text.toLowerCase().includes(b.toLowerCase()) && b !== 'VSK 3.0 Main')
    if (botMatch) {
      setActiveBot(botMatch)
      addBot(`${botMatch} activated.`)
      return
    }

    // ── Task detection ──────────────────────────────────────────────────
    const taskId = detectTask(text)
    if (taskId) {
      const flow = TASK_FLOWS[taskId]
      if (flow.steps.length === 0) {
        const af = flow.build({})
        openArtifact(af)
        addBot(flow.done)
      } else {
        setCollect({ taskId, stepIdx: 0, ctx: {} })
        const first = flow.steps[0]
        addBot(first.prompt, first.opts || [])
      }
      return
    }

    // ── Contextual shortcuts ─────────────────────────────────────────────
    const q = text.toLowerCase()
    if (q.includes('xamta') || q.includes('scan')) {
      addBot('📷 XAMTA Scan ready. Point your camera at the answer sheet and tap capture. (Camera feature opens on device.)', [])
      return
    }
    if (q.includes('at-risk') || q.includes('risk')) {
      addBot('⚠️ 3 students are at risk for Namo Laxmi eligibility:\n• Ravi Parmar — 74% attendance\n• Komal Patel — 71% attendance\n• Isha Jadeja — 79% attendance\nWould you like to send parent alerts?',
        ['Send alerts','View details','Mark attendance'])
      return
    }
    if (q.includes('parent alert') || q.includes('parent')) {
      addBot('📨 Parent alert system ready. Which class should receive the alert?',
        ['Class 6-A','Class 6-B','All classes'])
      return
    }
    if (q.includes('anomaly') || q.includes('war room')) {
      addBot('🔴 3 anomalies detected:\n• Daskroi: 72.1% attendance (below 75% threshold)\n• 142 schools flagged for follow-up\n• 2 data submission gaps\nWould you like the full dashboard?',
        ['Task: dashboard','View schools','Export report'])
      return
    }
    if (q.includes('student data')) {
      addBot('📋 Student data entry ready. What would you like to update?',
        ['New enrollment','Update records','Scheme eligibility'])
      return
    }

    // ── Fallback ─────────────────────────────────────────────────────────
    addBot(
      "I can help you with attendance, lesson plans, class performance, report cards, and scholarships. Try typing one of those, or tap a Quick Action below.",
      ['Task: attendance','Task: lesson_plan','Task: class_performance']
    )
  }, [collectState, activeBot, bots, addBot, openArtifact])

  const handleNew = () => {
    setMessages([])
    setCollect(null)
    setArtifact(null)
    setSession('New Chat')
    setSidebar(false)
  }

  const hasMessages = messages.length > 0

  return (
    <div className={`flex h-full overflow-hidden ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>

      {/* ── Sidebar — desktop always visible, mobile as drawer ── */}
      {/* Mobile overlay */}
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
          onClose={() => setSidebar(false)}
        />
      </div>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-bdr flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-txt-secondary hover:bg-surface-secondary"
            onClick={() => setSidebar(true)}
          >
            <Menu size={18} />
          </button>

          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setBotDrop(v => !v)}
              className="flex items-center gap-1.5 text-[14px] font-semibold text-txt-primary hover:bg-surface-secondary px-2.5 py-1.5 rounded-lg transition-colors"
            >
              {activeBot} <ChevronDown size={14} />
            </button>
            {showBotDrop && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-bdr rounded-xl shadow-modal z-20 min-w-[200px] py-1 animate-fade-in">
                {bots.map(b => (
                  <button
                    key={b}
                    onClick={() => { setActiveBot(b); setBotDrop(false) }}
                    className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-surface-secondary transition-colors ${b === activeBot ? 'text-primary font-semibold' : 'text-txt-primary'}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Theme toggle */}
          <button
            onClick={() => setDark(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-txt-secondary hover:bg-surface-secondary transition-colors"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg text-txt-secondary hover:bg-surface-secondary transition-colors">
            <Upload size={16} />
          </button>
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
                    <MessageBubble key={msg.id} msg={msg} onChipClick={handleSend} />
                  ))}
                  {typing && <TypingIndicator />}
                  <div ref={bottomRef} />
                </>
              )}
            </div>
            <InputBar onSend={handleSend} disabled={typing} />
          </div>

          {/* Artifact panel — desktop inline */}
          {artifact && (
            <div className="hidden md:flex flex-col" style={{ width:'46%', maxWidth:520, minWidth:320 }}>
              <ArtifactPanel artifact={artifact} onClose={() => setArtifact(null)} />
            </div>
          )}
        </div>
      </div>

      {/* Artifact modal — mobile full screen */}
      {artifact && <ArtifactModal artifact={artifact} onClose={() => setArtifact(null)} />}
    </div>
  )
}
