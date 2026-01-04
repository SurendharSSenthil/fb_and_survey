'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home () {
  const router = useRouter()

  useEffect(() => {
    // Redirect to student page by default
    router.push('/student')
  }, [router])

  return null
}

