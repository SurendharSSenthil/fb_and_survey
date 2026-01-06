'use client'

import { Layout, Typography } from 'antd'
import LoginForm from '../../components/LoginForm'

const { Header, Content, Footer } = Layout
const { Title } = Typography

export default function LoginPage () {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{
        background: '#1890ff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          Login
        </Title>
      </Header>
      <Content style={{ padding: '48px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <LoginForm />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#f0f2f5', padding: '12px' }}>
        Course Feedback & Survey System
      </Footer>
    </Layout>
  )
}
