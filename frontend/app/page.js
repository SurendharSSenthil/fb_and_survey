'use client'

import { useRouter } from 'next/navigation'
import { Layout, Card, Button, Space, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { Routes, Messages, UI, CSS_CLASSES } from '../lib/constants/index.js'

const { Header, Content, Footer } = Layout
const { Title, Text } = Typography

export default function Home () {
  const router = useRouter()

  const handleStudentClick = () => {
    router.push(Routes.STUDENT)
  }

  const handleAdminClick = () => {
    router.push(Routes.ADMIN)
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ 
        background: UI.COLORS.PRIMARY, 
        padding: `0 ${UI.SPACING.MD}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Title level={3} style={{ color: '#fff', margin: 0, fontSize: UI.FONT_SIZES.XXL }}>
          {Messages.SYSTEM_NAME}
        </Title>
      </Header>
      <Content style={{ 
        padding: `${UI.SPACING.XXL}px ${UI.SPACING.MD}px`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 128px)'
      }}>
        <Card style={{ 
          maxWidth: UI.LAYOUT.MAX_WIDTH.NARROW,
          width: '100%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <Title level={2} style={{ marginBottom: UI.SPACING.SM }}>
            {Messages.WELCOME_MESSAGE}
          </Title>
          <Text type='secondary' style={{ fontSize: UI.FONT_SIZES.MD, display: 'block', marginBottom: UI.SPACING.XL }}>
            {Messages.WELCOME_SELECT_ROLE}
          </Text>
          
          <Space direction='vertical' style={{ width: '100%' }} size='large'>
            <Button
              type='primary'
              size='large'
              icon={<UserOutlined />}
              onClick={handleStudentClick}
              block
              style={{ height: '60px', fontSize: UI.FONT_SIZES.LG }}
            >
              I am a Student
            </Button>
            <Button
              size='large'
              icon={<LockOutlined />}
              onClick={handleAdminClick}
              block
              style={{ height: '60px', fontSize: UI.FONT_SIZES.LG }}
            >
              I am an Admin
            </Button>
          </Space>
        </Card>
      </Content>
      <Footer style={{ textAlign: 'center', background: UI.COLORS.FOOTER_BG, padding: `${UI.SPACING.SM}px` }}>
        <Text type='secondary' style={{ fontSize: UI.FONT_SIZES.SM }}>
          {Messages.SYSTEM_NAME}
        </Text>
      </Footer>
    </Layout>
  )
}
