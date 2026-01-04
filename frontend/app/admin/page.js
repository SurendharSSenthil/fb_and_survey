'use client'

import { useState, useEffect } from 'react'
import { Layout, Card, Form, Input, Button, Table, Select, Space, Typography, Alert, Statistic, Row, Col, List, Divider } from 'antd'
import { LoginOutlined, LogoutOutlined } from '@ant-design/icons'
import api from '../../lib/api'
import { LikertLabels } from '../../lib/constants'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { Option } = Select

export default function AdminPage () {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Login form
  const [loginForm] = Form.useForm()

  // Departments
  const [departments, setDepartments] = useState([])
  const [newDeptCode, setNewDeptCode] = useState('')
  const [newDeptName, setNewDeptName] = useState('')

  // Courses
  const [courses, setCourses] = useState([])
  const [selectedDept, setSelectedDept] = useState(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedSemester, setSelectedSemester] = useState(1)

  // Reports
  const [reports, setReports] = useState([])

  // Check for existing token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('adminToken')
      if (savedToken) {
        setToken(savedToken)
        setIsLoggedIn(true)
      }
    }
  }, [])

  // Load departments when logged in
  useEffect(() => {
    if (isLoggedIn && token) {
      loadDepartments()
    }
  }, [isLoggedIn, token])

  const handleLogin = async (values) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.post('/admin/login', values)
      const { token: newToken } = response.data
      setToken(newToken)
      setIsLoggedIn(true)
      localStorage.setItem('adminToken', newToken)
      await loadDepartments()
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setToken(null)
    setIsLoggedIn(false)
    localStorage.removeItem('adminToken')
    setDepartments([])
    setCourses([])
    setReports([])
  }

  const loadDepartments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/departments', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDepartments(response.data)
    } catch (err) {
      setError(err.message || 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDepartment = async () => {
    if (!newDeptCode || !newDeptName) {
      setError('Please enter department code and name')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await api.post('/admin/departments', {
        code: newDeptCode.toUpperCase(),
        name: newDeptName,
        active: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNewDeptCode('')
      setNewDeptName('')
      await loadDepartments()
    } catch (err) {
      setError(err.message || 'Failed to create department')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadReport = async () => {
    if (!selectedDept) {
      setError('Please select a department')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/admin/report?deptCode=${selectedDept}&year=${selectedYear}&semester=${selectedSemester}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setReports(response.data)
    } catch (err) {
      setError(err.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Card style={{ width: '400px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
              Admin Login
            </Title>
            {error && (
              <Alert message={error} type='error' style={{ marginBottom: 16 }} />
            )}
            <Form form={loginForm} onFinish={handleLogin} layout='vertical'>
              <Form.Item
                name='username'
                label='Username'
                rules={[{ required: true, message: 'Please enter username' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name='password'
                label='Password'
                rules={[{ required: true, message: 'Please enter password' }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item>
                <Button type='primary' htmlType='submit' block loading={loading}>
                  Login
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#001529' }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>Admin Dashboard</Title>
        <Button icon={<LogoutOutlined />} onClick={handleLogout}>Logout</Button>
      </Header>
      <Content style={{ padding: '24px' }}>
        {error && (
          <Alert
            message={error}
            type='error'
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Row gutter={[16, 16]}>
          {/* Create Department */}
          <Col xs={24} md={12}>
            <Card title='Create Department'>
              <Space direction='vertical' style={{ width: '100%' }}>
                <Input
                  placeholder='Department Code (e.g., CSE)'
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                />
                <Input
                  placeholder='Department Name'
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                />
                <Button type='primary' block onClick={handleCreateDepartment} loading={loading}>
                  Create Department
                </Button>
              </Space>
            </Card>
          </Col>

          {/* View Reports */}
          <Col xs={24} md={12}>
            <Card title='View Reports'>
              <Space direction='vertical' style={{ width: '100%' }} size='middle'>
                <Select
                  style={{ width: '100%' }}
                  placeholder='Select Department'
                  value={selectedDept}
                  onChange={setSelectedDept}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={departments.map(dept => ({
                    value: dept.code,
                    label: `${dept.code} - ${dept.name}`
                  }))}
                />
                <Select
                  style={{ width: '100%' }}
                  value={selectedYear}
                  onChange={setSelectedYear}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <Option key={year} value={year}>{year}</Option>
                  ))}
                </Select>
                <Select
                  style={{ width: '100%' }}
                  value={selectedSemester}
                  onChange={setSelectedSemester}
                >
                  <Option value={1}>Semester 1</Option>
                  <Option value={2}>Semester 2</Option>
                </Select>
                <Button type='primary' block onClick={handleLoadReport} loading={loading}>
                  Load Report
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Reports Display */}
        {reports.length > 0 && (
          <div style={{ marginTop: 24 }}>
            {reports.map((report) => (
              <Card key={report.courseId} title={`${report.courseCode} - ${report.courseName}`} style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title='Survey Responses'
                      value={report.survey.totalResponses}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title='Feedback Responses'
                      value={report.feedback.totalResponses}
                    />
                  </Col>
                </Row>

                <Divider />

                {/* Survey Statistics */}
                {Object.keys(report.survey.questionStats).length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <Title level={5}>Survey Statistics</Title>
                    {Object.entries(report.survey.questionStats).map(([qId, stats]) => (
                      <Card key={qId} size='small' style={{ marginBottom: 8 }}>
                        <Text strong>{stats.questionText}</Text>
                        <Row gutter={16} style={{ marginTop: 8 }}>
                          <Col span={12}>
                            <Text>Average: {stats.average.toFixed(2)}</Text>
                          </Col>
                          <Col span={12}>
                            <Text>Responses: {stats.count}</Text>
                          </Col>
                        </Row>
                        <div style={{ marginTop: 8 }}>
                          <Text type='secondary' small>Distribution: </Text>
                          {Object.entries(stats.distribution).map(([value, count]) => (
                            <Text key={value} type='secondary' small>
                              {LikertLabels[value]}: {count}{' '}
                            </Text>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Feedback Statistics */}
                {Object.keys(report.feedback.questionStats).length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <Title level={5}>Feedback Statistics</Title>
                    {Object.entries(report.feedback.questionStats).map(([qId, stats]) => (
                      <Card key={qId} size='small' style={{ marginBottom: 8 }}>
                        <Text strong>{stats.questionText}</Text>
                        <Row gutter={16} style={{ marginTop: 8 }}>
                          <Col span={12}>
                            <Text>Average: {stats.average.toFixed(2)}</Text>
                          </Col>
                          <Col span={12}>
                            <Text>Responses: {stats.count}</Text>
                          </Col>
                        </Row>
                        <div style={{ marginTop: 8 }}>
                          <Text type='secondary' small>Distribution: </Text>
                          {Object.entries(stats.distribution).map(([value, count]) => (
                            <Text key={value} type='secondary' small>
                              {LikertLabels[value]}: {count}{' '}
                            </Text>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {report.feedback.recommendations?.length > 0 && (
                  <div>
                    <Title level={5}>Recommendations</Title>
                    <List
                      bordered
                      dataSource={report.feedback.recommendations}
                      renderItem={(item) => (
                        <List.Item>
                          <Text>{item}</Text>
                        </List.Item>
                      )}
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Content>
    </Layout>
  )
}

