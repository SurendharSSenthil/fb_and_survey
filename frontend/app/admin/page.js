'use client'

import { useState, useEffect } from 'react'
import { Layout, Card, Form, Input, Button, Table, Select, Space, Typography, Alert, Statistic, Row, Col, List, Divider, Modal } from 'antd'
import { LoginOutlined, LogoutOutlined, PlusOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import api from '../../lib/api'
import { LikertLabels } from '../../lib/constants'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { Option } = Select

export default function AdminPage () {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [checkedAuth, setCheckedAuth] = useState(false)

  // Login form
  const [loginForm] = Form.useForm()

  // Departments
  const [departments, setDepartments] = useState([])
  const [newDeptCode, setNewDeptCode] = useState('')
  const [newDeptName, setNewDeptName] = useState('')

  // Courses for reports
  const [courses, setCourses] = useState([])
  const [selectedDept, setSelectedDept] = useState(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedSemester, setSelectedSemester] = useState(1)
  const [downloadingSurvey, setDownloadingSurvey] = useState({})
  const [downloadingFeedback, setDownloadingFeedback] = useState({})

  // Course Creation
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [courseFormData, setCourseFormData] = useState({
    courseCode: '',
    courseName: '',
    deptCode: '',
    year: new Date().getFullYear(),
    semester: 1,
    surveyQuestions: [],
    feedbackQuestions: [],
    isActive: true
  })

  // Check for existing token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('adminToken')
      if (savedToken) {
        setToken(savedToken)
        setIsLoggedIn(true)
        setCheckedAuth(true)
      } else {
        setCheckedAuth(true)
        router.push('/login')
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
      const response = await api.post('/api/admin/login', values)
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
    router.push('/')
  }

  const loadDepartments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/admin/departments', {
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
      await api.post('/api/admin/departments', {
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

  const handleLoadCourses = async () => {
    if (!selectedDept) {
      setError('Please select a department')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/admin/report?deptCode=${selectedDept}&year=${selectedYear}&semester=${selectedSemester}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCourses(response.data)
    } catch (err) {
      setError(err.message || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleCourseClick = (courseId) => {
    router.push(`/course/${courseId}`)
  }

  const handleDownloadSurveySamples = async (courseId, courseCode, e) => {
    e.stopPropagation() // Prevent card click
    try {
      setDownloadingSurvey(prev => ({ ...prev, [courseId]: true }))
      setError(null)

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${API_URL}/api/admin/course/${courseId}/samples/survey`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        try {
          const jsonError = JSON.parse(errorData)
          throw new Error(jsonError.error?.message || 'Failed to download survey samples')
        } catch {
          throw new Error('Failed to download survey samples')
        }
      }

      // Get PDF blob
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `course_${courseCode}_survey_samples.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err.message || 'Failed to download survey samples')
    } finally {
      setDownloadingSurvey(prev => ({ ...prev, [courseId]: false }))
    }
  }

  const handleDownloadFeedbackSamples = async (courseId, courseCode, e) => {
    e.stopPropagation() // Prevent card click
    try {
      setDownloadingFeedback(prev => ({ ...prev, [courseId]: true }))
      setError(null)

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${API_URL}/api/admin/course/${courseId}/samples/feedback`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        try {
          const jsonError = JSON.parse(errorData)
          throw new Error(jsonError.error?.message || 'Failed to download feedback samples')
        } catch {
          throw new Error('Failed to download feedback samples')
        }
      }

      // Get PDF blob
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `course_${courseCode}_feedback_samples.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err.message || 'Failed to download feedback samples')
    } finally {
      setDownloadingFeedback(prev => ({ ...prev, [courseId]: false }))
    }
  }

  const handleOpenCourseModal = () => {
    setCourseFormData({
      courseCode: '',
      courseName: '',
      deptCode: '',
      year: new Date().getFullYear(),
      semester: 1,
      surveyQuestions: [],
      feedbackQuestions: [],
      isActive: true
    })
    setIsCourseModalOpen(true)
  }

  const handleCloseCourseModal = () => {
    setIsCourseModalOpen(false)
  }

  const handleAddSurveyQuestion = () => {
    const questionId = `SQ${Date.now()}`
    setCourseFormData({
      ...courseFormData,
      surveyQuestions: [
        ...courseFormData.surveyQuestions,
        { questionId, text: '' }
      ]
    })
  }

  const handleRemoveSurveyQuestion = (index) => {
    setCourseFormData({
      ...courseFormData,
      surveyQuestions: courseFormData.surveyQuestions.filter((_, i) => i !== index)
    })
  }

  const handleUpdateSurveyQuestion = (index, text) => {
    const updated = [...courseFormData.surveyQuestions]
    updated[index] = { ...updated[index], text }
    setCourseFormData({
      ...courseFormData,
      surveyQuestions: updated
    })
  }

  const handleAddFeedbackQuestion = () => {
    const questionId = `FQ${Date.now()}`
    setCourseFormData({
      ...courseFormData,
      feedbackQuestions: [
        ...courseFormData.feedbackQuestions,
        { questionId, text: '' }
      ]
    })
  }

  const handleRemoveFeedbackQuestion = (index) => {
    setCourseFormData({
      ...courseFormData,
      feedbackQuestions: courseFormData.feedbackQuestions.filter((_, i) => i !== index)
    })
  }

  const handleUpdateFeedbackQuestion = (index, text) => {
    const updated = [...courseFormData.feedbackQuestions]
    updated[index] = { ...updated[index], text }
    setCourseFormData({
      ...courseFormData,
      feedbackQuestions: updated
    })
  }


  const handleCreateCourse = async () => {
    if (!courseFormData.courseCode || !courseFormData.courseName || !courseFormData.deptCode) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Filter out empty questions
      const surveyQuestions = courseFormData.surveyQuestions.filter(q => q.text.trim())
      const feedbackQuestions = courseFormData.feedbackQuestions.filter(q => q.text.trim())

      await api.post('/api/admin/course', {
        courseCode: courseFormData.courseCode,
        courseName: courseFormData.courseName,
        deptCode: courseFormData.deptCode,
        year: courseFormData.year,
        semester: courseFormData.semester,
        surveyQuestions,
        feedbackQuestions,
        isActive: courseFormData.isActive
      }, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      })

      handleCloseCourseModal()
      setError(null)
      // Optionally reload courses if viewing the same dept/year/sem
      if (selectedDept === courseFormData.deptCode && selectedYear === courseFormData.year && selectedSemester === courseFormData.semester) {
        await handleLoadCourses()
      }
    } catch (err) {
      setError(err.message || 'Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  if (!checkedAuth || !isLoggedIn) {
    return null
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#001529' }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>Admin Dashboard</Title>
        <Button icon={<LogoutOutlined />} onClick={handleLogout}>Logout</Button>
      </Header>
      <Content className='student-content' style={{ padding: '24px' }}>
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
          <Col xs={24} md={8}>
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

          {/* Create Course */}
          <Col xs={24} md={8}>
            <Card title='Create Course'>
              <Button type='primary' block onClick={handleOpenCourseModal} style={{ height: 'auto', padding: '12px' }}>
                <PlusOutlined /> Add New Course
              </Button>
            </Card>
          </Col>

          {/* View Reports */}
          <Col xs={24} md={8}>
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
                  <Option value={3}>Semester 3</Option>
                  <Option value={4}>Semester 4</Option>
                  <Option value={5}>Semester 5</Option>
                  <Option value={6}>Semester 6</Option>
                  <Option value={7}>Semester 7</Option>
                  <Option value={8}>Semester 8</Option>
                </Select>
                <Button type='primary' block onClick={handleLoadCourses} loading={loading}>
                  Show Courses
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Courses Display */}
        {courses.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Title level={3} style={{ marginBottom: 16 }}>Courses</Title>
            <Row gutter={[16, 16]}>
              {courses.map((course) => (
                <Col xs={24} sm={12} md={8} lg={6} key={course.courseId}>
                  <Card
                    hoverable
                    onClick={() => handleCourseClick(course.courseId)}
                    style={{
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Title level={4} style={{ marginBottom: 8 }}>
                      {course.courseCode}
                    </Title>
                    <Text type='secondary' style={{ fontSize: '14px' }}>
                      {course.courseName}
                    </Text>
                    <div style={{ marginTop: 12 }}>
                      <Row gutter={8}>
                        <Col span={12}>
                          <Statistic
                            title='Survey'
                            value={course.survey?.totalResponses || 0}
                            valueStyle={{ fontSize: '18px' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title='Feedback'
                            value={course.feedback?.totalResponses || 0}
                            valueStyle={{ fontSize: '18px' }}
                          />
                        </Col>
                      </Row>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Space direction='vertical' style={{ width: '100%' }} size='small'>
                        <Button
                          type='default'
                          size='small'
                          icon={<DownloadOutlined />}
                          onClick={(e) => handleDownloadSurveySamples(course.courseId, course.courseCode, e)}
                          loading={downloadingSurvey[course.courseId]}
                          block
                        >
                          Survey Samples
                        </Button>
                        <Button
                          type='default'
                          size='small'
                          icon={<DownloadOutlined />}
                          onClick={(e) => handleDownloadFeedbackSamples(course.courseId, course.courseCode, e)}
                          loading={downloadingFeedback[course.courseId]}
                          block
                        >
                          Feedback Samples
                        </Button>
                      </Space>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Course Creation Modal */}
        <Modal
          title='Create New Course'
          open={isCourseModalOpen}
          onCancel={handleCloseCourseModal}
          footer={null}
          width={800}
          style={{ top: 20 }}
        >
          <Space direction='vertical' style={{ width: '100%' }} size='large'>
            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <Text strong>Department *</Text>
                  <Select
                    style={{ width: '100%', marginTop: 8 }}
                    placeholder='Select Department'
                    value={courseFormData.deptCode}
                    onChange={(value) => setCourseFormData({ ...courseFormData, deptCode: value })}
                    showSearch
                    options={departments.map(dept => ({
                      value: dept.code,
                      label: `${dept.code} - ${dept.name}`
                    }))}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Year *</Text>
                  <Select
                    style={{ width: '100%', marginTop: 8 }}
                    value={courseFormData.year}
                    onChange={(value) => setCourseFormData({ ...courseFormData, year: value })}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <Option key={year} value={year}>{year}</Option>
                    ))}
                  </Select>
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <Text strong>Semester *</Text>
                  <Select
                    style={{ width: '100%', marginTop: 8 }}
                    value={courseFormData.semester}
                    onChange={(value) => setCourseFormData({ ...courseFormData, semester: value })}
                  >
                    <Option value={1}>Semester 1</Option>
                    <Option value={2}>Semester 2</Option>
                    <Option value={3}>Semester 3</Option>
                    <Option value={4}>Semester 4</Option>
                    <Option value={5}>Semester 5</Option>
                    <Option value={6}>Semester 6</Option>
                    <Option value={7}>Semester 7</Option>
                    <Option value={8}>Semester 8</Option>
                  </Select>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Course Code *</Text>
                  <Input
                    style={{ marginTop: 8 }}
                    placeholder='e.g., CS101'
                    value={courseFormData.courseCode}
                    onChange={(e) => setCourseFormData({ ...courseFormData, courseCode: e.target.value.toUpperCase() })}
                  />
                </div>
              </Col>
            </Row>

            <div>
              <Text strong>Course Name *</Text>
              <Input
                style={{ marginTop: 8 }}
                placeholder='Enter course name'
                value={courseFormData.courseName}
                onChange={(e) => setCourseFormData({ ...courseFormData, courseName: e.target.value })}
              />
            </div>

            <Divider>Survey Questions</Divider>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text strong>Survey Questions</Text>
                <Button
                  type='dashed'
                  icon={<PlusOutlined />}
                  onClick={handleAddSurveyQuestion}
                  size='small'
                >
                  Add Question
                </Button>
              </div>
              <Space direction='vertical' style={{ width: '100%' }} size='middle'>
                {courseFormData.surveyQuestions.map((question, index) => (
                  <Card key={question.questionId} size='small'>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Input
                        placeholder={`Survey Question ${index + 1}`}
                        value={question.text}
                        onChange={(e) => handleUpdateSurveyQuestion(index, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveSurveyQuestion(index)}
                      />
                    </div>
                  </Card>
                ))}
                {courseFormData.surveyQuestions.length === 0 && (
                  <Text type='secondary' style={{ fontStyle: 'italic' }}>
                    No survey questions added. Click "Add Question" to add one.
                  </Text>
                )}
              </Space>
            </div>

            <Divider>Feedback Questions</Divider>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text strong>Feedback Questions</Text>
                <Button
                  type='dashed'
                  icon={<PlusOutlined />}
                  onClick={handleAddFeedbackQuestion}
                  size='small'
                >
                  Add Question
                </Button>
              </div>
              <Space direction='vertical' style={{ width: '100%' }} size='middle'>
                {courseFormData.feedbackQuestions.map((question, index) => (
                  <Card key={question.questionId} size='small'>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Input
                        placeholder={`Feedback Question ${index + 1}`}
                        value={question.text}
                        onChange={(e) => handleUpdateFeedbackQuestion(index, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveFeedbackQuestion(index)}
                      />
                    </div>
                  </Card>
                ))}
                {courseFormData.feedbackQuestions.length === 0 && (
                  <Text type='secondary' style={{ fontStyle: 'italic' }}>
                    No feedback questions added. Click "Add Question" to add one.
                  </Text>
                )}
              </Space>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <Button onClick={handleCloseCourseModal}>
                Cancel
              </Button>
              <Button type='primary' onClick={handleCreateCourse} loading={loading}>
                Create Course
              </Button>
            </div>
          </Space>
        </Modal>
      </Content>
    </Layout>
  )
}

