'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Card, Typography, Space, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import api from '../lib/api'
import { API_ENDPOINTS, STORAGE_KEYS, Messages } from '../lib/constants/index.js'
import { saveStudentSession } from '../lib/utils'

const { Title, Text } = Typography

export default function LoginForm({ userType = 'student', onSuccess }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values) => {
    try {
      setLoading(true)

      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, values)

      if (response.success) {
        if (response.data.role === 'admin') {
          localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, response.data.token)

          if (onSuccess) {
            onSuccess(response.data)
          } else {
            router.push('/admin')
          }
        } else {
          saveStudentSession(response.data.studentId, response.data.issuedAt)

          if (onSuccess) {
            onSuccess(response.data)
          } else {
            router.push('/student')
          }
        }
      }
    } catch (err) {
      message.error(err.message || Messages.ERROR_GENERIC)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card style={{ maxWidth: 400, margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
          Login
        </Title>
        <Text type="secondary">
          Enter your credentials
        </Text>
      </div>

      <Form
        name="login"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Username"
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{ height: 40 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Default password for newly generated student IDs is "Student"
        </Text>
      </div>
    </Card>
  )
}
