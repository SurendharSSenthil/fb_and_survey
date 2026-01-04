'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Layout, Select, Button, Card, Space, Typography, Alert, Spin, Row, Col, Tag } from 'antd'
import { CheckCircleOutlined, FileTextOutlined, MessageOutlined } from '@ant-design/icons'
import api from '../../lib/api'
import { getStudentSession, saveStudentSession, clearStudentSession, isSessionExpired } from '../../lib/utils'

const { Header, Content, Footer } = Layout
const { Title, Text } = Typography

export default function StudentPage () {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Department, Year, Semester
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState("")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedSemester, setSelectedSemester] = useState(1)

  // Student ID
  const [studentId, setStudentId] = useState(null)
  const [studentSession, setStudentSession] = useState(null)

  // Courses
  const [courses, setCourses] = useState([])
  const [courseStatus, setCourseStatus] = useState([])

  // Initialize: Check for existing session
  useEffect(() => {
    const session = getStudentSession()
    if (session && !isSessionExpired(session.issuedAt)) {
      setStudentSession(session)
      setStudentId(session.studentId)
      // Extract dept, year, sem from studentId (format: DEPTYYYYSSSSS)
      const deptMatch = session.studentId.match(/^([A-Z]+)(\d{4})(\d)(\d+)$/)
      if (deptMatch) {
        console.log(deptMatch)
        const dept = deptMatch[1]
        const year = parseInt(deptMatch[2])
        const sem  = parseInt(deptMatch[3])

        setSelectedDept(dept)
        setSelectedYear(year)
        setSelectedSemester(sem)
        loadCourses(session.studentId, dept, year, sem)
      }
    } else if (session) {
      clearStudentSession()
    }
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/departments/active')
      setDepartments(response.data)
    } catch (err) {
      setError(err.message || 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateId = async () => {
    if (!selectedDept) {
      setError('Please select a department')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Generate student ID
      const response = await api.post('/api/student/generate-id', {
        deptCode: selectedDept,
        year: selectedYear,
        semester: selectedSemester
      })

      const { studentId: newStudentId, issuedAt } = response.data
      setStudentId(newStudentId)
      saveStudentSession(newStudentId, issuedAt)
      setStudentSession({ studentId: newStudentId, issuedAt })

      // Load courses
      await loadCourses(newStudentId, selectedDept, selectedYear, selectedSemester)
    } catch (err) {
      setError(err.message || 'Failed to generate student ID')
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async (sid = studentId, dept = selectedDept,
    year = selectedYear,
    sem = selectedSemester) => {
    console.log(sid, dept, year, sem)
    if (!sid || !dept) return

    try {
      console.log('Loading courses')
      setLoading(true)
      const [coursesRes, statusRes] = await Promise.all([
        api.get(`/api/student/courses?deptCode=${dept}&year=${year}&semester=${sem}`),
        api.get(`/api/student/status?studentId=${sid}&deptCode=${dept}&year=${year}&semester=${sem}`)
      ])

      setCourses(coursesRes.data)
      setCourseStatus(statusRes.data)
    } catch (err) {
      setError(err.message || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleSurveyClick = (course) => {
    // Store course data in localStorage for the survey page
    localStorage.setItem(`course_${course._id || course.courseId}`, JSON.stringify(course))
    router.push(`/survey?courseId=${course._id || course.courseId}`)
  }

  const handleFeedbackClick = (course) => {
    // Store course data in localStorage for the feedback page
    localStorage.setItem(`course_${course._id || course.courseId}`, JSON.stringify(course))
    router.push(`/feedback?courseId=${course._id || course.courseId}`)
  }

  // Show department selection if no session
  if (!studentId) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Header style={{ 
          background: '#001529', 
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Title level={3} className='student-header-title' style={{ color: '#fff', margin: 0, fontSize: '20px' }}>
            Course Feedback & Survey
          </Title>
        </Header>
        <Content className='student-content' style={{ 
          padding: '24px 16px',
          maxWidth: '600px',
          margin: '0 auto',
          width: '100%'
        }}>
          <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Text style={{ 
              display: 'block', 
              textAlign: 'center', 
              color: '#666', 
              marginBottom: 24,
              fontSize: '14px'
            }}>
              Please select your department, year, and semester to begin
            </Text>

            {error && (
              <Alert
                message={error}
                type='error'
                closable
                onClose={() => setError(null)}
                style={{ marginBottom: 16 }}
              />
            )}

            <Space direction='vertical' style={{ width: '100%' }} size='middle'>
              <div>
                <Text strong style={{ fontSize: '14px' }}>Department</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder='Select Department'
                  size='large'
                  value={selectedDept}
                  onChange={setSelectedDept}
                  loading={loading}
                >
                  {departments.map(dept => (
                    <Select.Option key={dept.code} value={dept.code}>
                      {dept.code} - {dept.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Text strong style={{ fontSize: '14px' }}>Year</Text>
                    <Select
                      style={{ width: '100%', marginTop: 8 }}
                      size='large'
                      value={selectedYear}
                      onChange={setSelectedYear}
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <Select.Option key={year} value={year}>{year}</Select.Option>
                      ))}
                    </Select>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <Text strong style={{ fontSize: '14px' }}>Semester</Text>
                    <Select
                      style={{ width: '100%', marginTop: 8 }}
                      size='large'
                      value={selectedSemester}
                      onChange={setSelectedSemester}
                    >
                      <Select.Option value={1}>Semester 1</Select.Option>
                      <Select.Option value={2}>Semester 2</Select.Option>
                      <Select.Option value={3}>Semester 3</Select.Option>
                      <Select.Option value={4}>Semester 4</Select.Option>
                      <Select.Option value={5}>Semester 5</Select.Option>
                      <Select.Option value={6}>Semester 6</Select.Option>
                      <Select.Option value={7}>Semester 7</Select.Option>
                      <Select.Option value={8}>Semester 8</Select.Option>
                    </Select>
                  </div>
                </Col>
              </Row>

              <Button
                type='primary'
                block
                size='large'
                onClick={handleGenerateId}
                loading={loading}
                style={{ marginTop: 8, height: '48px' }}
              >
                Continue
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

  // Show courses list
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ 
        background: '#001529', 
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        minHeight: '64px'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Title level={3} className='student-header-title' style={{ 
            color: '#fff', 
            margin: 0, 
            fontSize: '18px',
            marginBottom: '4px'
          }}>
            Course Feedback & Survey
          </Title>
          <Text type='secondary' className='student-header-subtitle' style={{ 
            color: 'rgba(255, 255, 255, 0.65)',
            fontSize: '12px',
            display: 'block'
          }}>
            {selectedDept} • {selectedYear} • Semester {selectedSemester}
          </Text>
        </div>
        <Tag color='blue' className='student-header-tag' style={{ 
          fontSize: '12px', 
          padding: '4px 10px',
          margin: 0,
          whiteSpace: 'nowrap'
        }}>
          ID: {studentId}
        </Tag>
      </Header>
      <Content className='student-content' style={{ 
        padding: '16px',
        width: '100%',
        maxWidth: '100%'
      }}>
        {error && (
          <Alert
            message={error}
            type='error'
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {loading && courses.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size='large' />
              <div style={{ marginTop: 16 }}>
                <Text type='secondary' style={{ fontSize: '14px' }}>
                  Loading courses...
                </Text>
              </div>
            </div>
          </Card>
        ) : (
          <Row gutter={[8, 8]}>
            {courses.map((course, index) => {
              const courseId = course._id || course.courseId
              const courseIdStr = courseId?.toString()
              const status = courseStatus.find(s => {
                const statusCourseId = s.courseId?.toString()
                return statusCourseId === courseIdStr
              })
              const surveyDone = status?.surveySubmitted
              const feedbackDone = status?.feedbackSubmitted
              const hasSurvey = course.surveyQuestions?.length > 0
              const hasFeedback = course.feedbackQuestions?.length > 0

              return (
                <Col xs={24} sm={12} lg={8} xl={6} key={courseId || index}>
                  <Card
                    style={{
                      height: '100%',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ marginBottom: 16 }}>
                      <Title level={4} className='student-card-title' style={{ 
                        marginBottom: 8,
                        fontSize: '16px'
                      }}>
                        {course.courseCode}
                      </Title>
                      <Text type='secondary' className='student-card-text' style={{ 
                        fontSize: '13px',
                        display: 'block',
                        wordBreak: 'break-word'
                      }}>
                        {course.courseName}
                      </Text>
                    </div>

                    <Space direction='vertical' style={{ width: '100%' }} size='middle'>
                      {/* Survey Status */}
                      {hasSurvey && (
                        <div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: 8
                          }}>
                            <Space>
                              <FileTextOutlined style={{ fontSize: '14px' }} />
                              <Text strong className='student-button-text' style={{ fontSize: '13px' }}>Survey</Text>
                            </Space>
                            {surveyDone ? (
                              <Tag color='success' icon={<CheckCircleOutlined />} className='student-tag' style={{ fontSize: '11px' }}>
                                Completed
                              </Tag>
                            ) : (
                              <Tag color='warning' className='student-tag' style={{ fontSize: '11px' }}>Pending</Tag>
                            )}
                          </div>
                          <Button
                            type={surveyDone ? 'default' : 'primary'}
                            block
                            icon={<FileTextOutlined />}
                            onClick={() => handleSurveyClick(course)}
                            disabled={surveyDone}
                            className='student-button-text'
                            style={{ fontSize: '13px' }}
                          >
                            {surveyDone ? 'View Survey' : 'Submit Survey'}
                          </Button>
                        </div>
                      )}

                      {/* Feedback Status */}
                      {hasFeedback && (
                        <div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: 8
                          }}>
                            <Space>
                              <MessageOutlined style={{ fontSize: '14px' }} />
                              <Text strong className='student-button-text' style={{ fontSize: '13px' }}>Feedback</Text>
                            </Space>
                            {feedbackDone ? (
                              <Tag color='success' icon={<CheckCircleOutlined />} className='student-tag' style={{ fontSize: '11px' }}>
                                Completed
                              </Tag>
                            ) : (
                              <Tag color='warning' className='student-tag' style={{ fontSize: '11px' }}>Pending</Tag>
                            )}
                          </div>
                          <Button
                            type={feedbackDone ? 'default' : 'primary'}
                            block
                            icon={<MessageOutlined />}
                            onClick={() => handleFeedbackClick(course)}
                            disabled={feedbackDone}
                            className='student-button-text'
                            style={{ fontSize: '13px' }}
                          >
                            {feedbackDone ? 'View Feedback' : 'Submit Feedback'}
                          </Button>
                        </div>
                      )}
                    </Space>
                  </Card>
                </Col>
              )
            })}
          </Row>
        )}

        {courses.length === 0 && !loading && (
          <Card>
            <Alert message='No active courses found for the selected criteria' type='info' />
          </Card>
        )}
      </Content>
      <Footer style={{ 
        textAlign: 'center', 
        background: '#f0f0f0', 
        padding: '12px'
      }}>
        <Text type='secondary' style={{ fontSize: '12px' }}>
          Course Feedback & Survey System
        </Text>
      </Footer>
    </Layout>
  )
}
