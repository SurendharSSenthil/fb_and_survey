'use client'

import { useRouter } from 'next/navigation'
import { Layout, Card, Button, Space, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'

const { Header, Content, Footer } = Layout
const { Title, Text } = Typography

export default function Home () {
  const router = useRouter()

  const handleStudentClick = () => {
    router.push('/student')
  }

  const handleAdminClick = () => {
    router.push('/admin')
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ 
        background: '#001529', 
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Title level={3} style={{ color: '#fff', margin: 0, fontSize: '20px' }}>
          Course Feedback & Survey System
        </Title>
      </Header>
      <Content style={{ 
        padding: '40px 16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 128px)'
      }}>
        <Card style={{ 
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Welcome
          </Title>
          <Text type='secondary' style={{ fontSize: '14px', display: 'block', marginBottom: 32 }}>
            Please select your role to continue
          </Text>
          
          <Space direction='vertical' style={{ width: '100%' }} size='large'>
            <Button
              type='primary'
              size='large'
              icon={<UserOutlined />}
              onClick={handleStudentClick}
              block
              style={{ height: '60px', fontSize: '16px' }}
            >
              I am a Student
            </Button>
            <Button
              size='large'
              icon={<LockOutlined />}
              onClick={handleAdminClick}
              block
              style={{ height: '60px', fontSize: '16px' }}
            >
              I am an Admin
            </Button>
          </Space>
        </Card>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#f0f0f0', padding: '12px' }}>
        <Text type='secondary' style={{ fontSize: '12px' }}>
          Course Feedback & Survey System
        </Text>
      </Footer>
    </Layout>
  )
}
