'use client'

import { useState, useEffect } from 'react'
import { Select, Button, Card, Radio, Input, Space, Typography, Alert, Spin, Row, Col, Modal, Tag, Divider } from 'antd'
import { CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import api from '../../lib/api'
import { getStudentSession, saveStudentSession, clearStudentSession, isSessionExpired } from '../../lib/utils'
import { LikertLabels } from '../../lib/constants'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export default function StudentPage () {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Department, Year, Semester
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedSemester, setSelectedSemester] = useState(1)

  // Student ID
  const [studentId, setStudentId] = useState(null)
  const [studentSession, setStudentSession] = useState(null)

  // Courses
  const [courses, setCourses] = useState([])
  const [courseStatus, setCourseStatus] = useState([])

  // Feedback Modal
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [surveyAnswers, setSurveyAnswers] = useState({})
  const [feedbackAnswers, setFeedbackAnswers] = useState({})
  const [recommendation, setRecommendation] = useState('')

  // Initialize: Check for existing session
  useEffect(() => {
    const session = getStudentSession()
    if (session && !isSessionExpired(session.issuedAt)) {
      setStudentSession(session)
      setStudentId(session.studentId)
      // Extract dept, year, sem from studentId (format: DEPTYYYYSSSSS)
      const deptMatch = session.studentId.match(/^([A-Z]+)(\d{4})(\d)(\d+)$/)
      if (deptMatch) {
        setSelectedDept(deptMatch[1])
        setSelectedYear(parseInt(deptMatch[2]))
        setSelectedSemester(parseInt(deptMatch[3]))
        loadCourses(session.studentId)
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
      await loadCourses(newStudentId)
    } catch (err) {
      setError(err.message || 'Failed to generate student ID')
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async (sid = studentId) => {
    if (!sid || !selectedDept) return

    try {
      setLoading(true)
      const [coursesRes, statusRes] = await Promise.all([
        api.get(`/api/student/courses?deptCode=${selectedDept}&year=${selectedYear}&semester=${selectedSemester}`),
        api.get(`/api/student/status?studentId=${sid}&deptCode=${selectedDept}&year=${selectedYear}&semester=${selectedSemester}`)
      ])

      setCourses(coursesRes.data)
      setCourseStatus(statusRes.data)
    } catch (err) {
      setError(err.message || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleCourseClick = (course) => {
    const courseId = course._id || course.courseId
    const status = courseStatus.find(s => {
      const statusCourseId = s.courseId?.toString()
      return statusCourseId === courseId?.toString()
    })

    // Check if already submitted
    if (status?.surveySubmitted && status?.feedbackSubmitted) {
      setError('You have already submitted feedback for this course')
      return
    }

    setSelectedCourse({
      ...course,
      _id: courseId
    })
    setSurveyAnswers({})
    setFeedbackAnswers({})
    setRecommendation('')
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedCourse(null)
    setSurveyAnswers({})
    setFeedbackAnswers({})
    setRecommendation('')
  }

  const handleSubmit = async () => {
    if (!selectedCourse) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const hasSurvey = selectedCourse.surveyQuestions?.length > 0
      const hasFeedback = selectedCourse.feedbackQuestions?.length > 0

      const surveyAnswersArray = hasSurvey
        ? selectedCourse.surveyQuestions.map(q => ({
            questionId: q.questionId,
            value: surveyAnswers[q.questionId]
          })).filter(a => a.value)
        : []

      const feedbackAnswersArray = hasFeedback
        ? selectedCourse.feedbackQuestions.map(q => ({
            questionId: q.questionId,
            value: feedbackAnswers[q.questionId]
          })).filter(a => a.value)
        : []

      if (surveyAnswersArray.length === 0 && feedbackAnswersArray.length === 0) {
        setError('Please answer at least one question')
        return
      }

      await api.post('/api/student/submit', {
        studentId,
        courseId: selectedCourse._id,
        surveyAnswers: surveyAnswersArray.length > 0 ? surveyAnswersArray : undefined,
        feedbackAnswers: feedbackAnswersArray.length > 0 ? feedbackAnswersArray : undefined,
        recommendation: recommendation.trim() || undefined
      })

      setSuccess('Feedback submitted successfully!')
      handleModalClose()
      await loadCourses()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  // Show department selection if no session
  if (!studentId) {
    return (
      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh', background: '#f5f5f5' }}>
        <Card style={{ marginTop: '40px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
            Course Feedback & Survey
          </Title>
          <Paragraph style={{ textAlign: 'center', color: '#666', marginBottom: 32 }}>
            Please select your department, year, and semester to begin
          </Paragraph>

          {error && (
            <Alert
              message={error}
              type='error'
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: 24 }}
            />
          )}

          <Space direction='vertical' style={{ width: '100%' }} size='large'>
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
      </div>
    )
  }

  // Show courses list
  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', minHeight: '100vh', background: '#f5f5f5' }}>
      <Card style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Course Feedback & Survey
            </Title>
            <Text type='secondary' style={{ fontSize: '14px' }}>
              {selectedDept} • {selectedYear} • Semester {selectedSemester}
            </Text>
          </div>
          <div>
            <Tag color='blue' style={{ fontSize: '13px', padding: '4px 12px' }}>
              ID: {studentId}
            </Tag>
          </div>
        </div>
      </Card>

      {error && (
        <Alert
          message={error}
          type='error'
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {success && (
        <Alert
          message={success}
          type='success'
          closable
          onClose={() => setSuccess(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {loading && courses.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size='large' />
            <div style={{ marginTop: 16 }}>
              <Text type='secondary'>Loading courses...</Text>
            </div>
          </div>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {courses.map((course, index) => {
            const courseId = course._id || course.courseId
            const courseIdStr = courseId?.toString()
            const status = courseStatus.find(s => {
              const statusCourseId = s.courseId?.toString()
              return statusCourseId === courseIdStr
            })
            const surveyDone = status?.surveySubmitted
            const feedbackDone = status?.feedbackSubmitted
            const allDone = surveyDone && feedbackDone

            return (
              <Col xs={24} sm={12} lg={8} key={courseId || index}>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    cursor: allDone ? 'default' : 'pointer',
                    opacity: allDone ? 0.7 : 1,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onClick={() => !allDone && handleCourseClick({ ...course, _id: courseId })}
                  actions={[
                    allDone ? (
                      <Space key='done'>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <Text type='success'>Completed</Text>
                      </Space>
                    ) : (
                      <Button type='primary' key='submit' onClick={(e) => {
                        e.stopPropagation()
                        handleCourseClick({ ...course, _id: courseId })
                      }}>
                        Submit Feedback
                      </Button>
                    )
                  ]}
                >
                  <div>
                    <Title level={4} style={{ marginBottom: 8 }}>
                      {course.courseCode}
                    </Title>
                    <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 12, color: '#666' }}>
                      {course.courseName}
                    </Paragraph>
                    <Space size='small'>
                      {surveyDone && <Tag color='green'>Survey</Tag>}
                      {feedbackDone && <Tag color='green'>Feedback</Tag>}
                      {!surveyDone && <Tag color='orange'>Survey Pending</Tag>}
                      {!feedbackDone && <Tag color='orange'>Feedback Pending</Tag>}
                    </Space>
                  </div>
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

      {/* Feedback Modal */}
      <Modal
        title={
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {selectedCourse?.courseCode} - {selectedCourse?.courseName}
            </Title>
          </div>
        }
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        {error && (
          <Alert
            message={error}
            type='error'
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '8px 0' }}>
          {/* Survey Questions */}
          {selectedCourse?.surveyQuestions?.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <Title level={5} style={{ marginBottom: 16 }}>
                Survey Questions
              </Title>
              <Space direction='vertical' style={{ width: '100%' }} size='large'>
                {selectedCourse.surveyQuestions.map(question => (
                  <Card key={question.questionId} size='small' style={{ background: '#fafafa' }}>
                    <Text strong style={{ fontSize: '15px' }}>{question.text}</Text>
                    <Radio.Group
                      style={{ width: '100%', marginTop: 12 }}
                      value={surveyAnswers[question.questionId]}
                      onChange={(e) => setSurveyAnswers({
                        ...surveyAnswers,
                        [question.questionId]: e.target.value
                      })}
                    >
                      <Space direction='vertical' style={{ width: '100%' }}>
                        {Object.entries(LikertLabels).map(([value, label]) => (
                          <Radio key={value} value={parseInt(value)} style={{ display: 'block', padding: '4px 0' }}>
                            {label}
                          </Radio>
                        ))}
                      </Space>
                    </Radio.Group>
                  </Card>
                ))}
              </Space>
            </div>
          )}

          {/* Feedback Questions */}
          {selectedCourse?.feedbackQuestions?.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <Divider />
              <Title level={5} style={{ marginBottom: 16 }}>
                Feedback Questions
              </Title>
              <Space direction='vertical' style={{ width: '100%' }} size='large'>
                {selectedCourse.feedbackQuestions.map(question => (
                  <Card key={question.questionId} size='small' style={{ background: '#fafafa' }}>
                    <Text strong style={{ fontSize: '15px' }}>{question.text}</Text>
                    <Radio.Group
                      style={{ width: '100%', marginTop: 12 }}
                      value={feedbackAnswers[question.questionId]}
                      onChange={(e) => setFeedbackAnswers({
                        ...feedbackAnswers,
                        [question.questionId]: e.target.value
                      })}
                    >
                      <Space direction='vertical' style={{ width: '100%' }}>
                        {Object.entries(LikertLabels).map(([value, label]) => (
                          <Radio key={value} value={parseInt(value)} style={{ display: 'block', padding: '4px 0' }}>
                            {label}
                          </Radio>
                        ))}
                      </Space>
                    </Radio.Group>
                  </Card>
                ))}
              </Space>
            </div>
          )}

          {/* Recommendation */}
          <div style={{ marginBottom: 24 }}>
            <Divider />
            <Title level={5} style={{ marginBottom: 12 }}>
              Additional Recommendations (Optional)
            </Title>
            <TextArea
              rows={4}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder='Enter your recommendations or feedback...'
              style={{ fontSize: '14px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Button onClick={handleModalClose}>
            Cancel
          </Button>
          <Button type='primary' onClick={handleSubmit} loading={loading} size='large'>
            Submit Feedback
          </Button>
        </div>
      </Modal>
    </div>
  )
}
