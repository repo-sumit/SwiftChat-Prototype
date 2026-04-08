import React from 'react'
import logoImg from '../assets/images/swiftchat-logo.png'

/**
 * SwiftChat logo — uses the official brand PNG icon.
 */
export default function Logo({ size = 36, showText = false, textColor = '#1A1F36' }) {
  return (
    <div className="flex items-center gap-2">
      {/* PNG icon mark */}
      <img
        src={logoImg}
        alt="SwiftChat"
        width={size}
        height={size}
        style={{ objectFit: 'contain', display: 'block' }}
        draggable={false}
      />

      {showText && (
        <span
          className="font-bold tracking-tight"
          style={{ fontSize: size * 0.56, color: textColor, fontFamily: 'Montserrat, sans-serif' }}
        >
          Swift<span style={{ color: '#386AF6' }}>Chat</span>
        </span>
      )}
    </div>
  )
}
