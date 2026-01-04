'use client'

import { Layout, Typography, Card, Row, Col } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'

const { Header, Content, Footer } = Layout
const { Title, Paragraph } = Typography

export default function Home () {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: '#001529',
        padding: '0 24px'
      }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          FB and Survey
        </Title>
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <Row justify='center' style={{ marginTop: '50px' }}>
          <Col xs={24} sm={24} md={20} lg={16} xl={12}>
            <Card>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a' }} />
              </div>
              <Title level={2} style={{ textAlign: 'center' }}>
                Welcome to FB and Survey
              </Title>
              <Paragraph style={{ textAlign: 'center', fontSize: '16px' }}>
                Your application is set up and ready to go!
              </Paragraph>
              <Row gutter={[16, 16]} style={{ marginTop: '32px' }}>
                <Col xs={24} sm={12}>
                  <Card size='small' title='Frontend' bordered>
                    <Paragraph>Next.js with Ant Design</Paragraph>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size='small' title='Backend' bordered>
                    <Paragraph>Node.js + Express.js</Paragraph>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size='small' title='Database' bordered>
                    <Paragraph>MongoDB Atlas</Paragraph>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size='small' title='Logging' bordered>
                    <Paragraph>Winston Logger</Paragraph>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
        FB and Survey ©2024
      </Footer>
    </Layout>
  )
}

