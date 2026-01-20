'use client'

import React from 'react'
import AppLayout from '../../components/AppLayout'
import LoginForm from '../../components/LoginForm'

export default function LoginPage() {
  return (
    <AppLayout showHeader={true} showFooter={true}>
      <div style={{ padding: '48px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <LoginForm />
        </div>
      </div>
    </AppLayout>
  )
}
