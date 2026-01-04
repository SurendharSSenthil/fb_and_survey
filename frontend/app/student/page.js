'use client'

import { useState, useEffect } from 'react'
import { Steps, Select, Button, Card, Radio, Input, Space, Typography, Alert, Spin, Row, Col } from 'antd'
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import api from '../../lib/api'
import { getStudentSession, saveStudentSession, clearStudentSession, isSessionExpired } from '../../lib/utils'
import { LikertScale, LikertLabels } from '../../lib/constants'

const { Step } = Steps
const { Title, Text } = Typography
const { TextArea } = Input

export default function StudentPage () {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Step 1: Department, Year, Semester
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedSemester, setSelectedSemester] = useState(1)

  // Step 2: Student ID
  const [studentId, setStudentId] = useState(null)
  const [studentSession, setStudentSession] = useState(null)

  // Step 3: Courses
  const [courses, setCourses] = useState([])
  const [courseStatus, setCourseStatus] = useState([])

  // Step 4: Selected Course & Answers
  const [selectedCourse, setSelectedCourse] = useState(null)
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
        setCurrentStep(2) // Skip to courses step
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

  const handleStep1Next = async () => {
    if (!selectedDept) {
      setError('Please select a department')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Generate student ID
      const response = await api.post('/student/generate-id', {
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
      setCurrentStep(2)
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
        api.get(`/student/courses?deptCode=${selectedDept}&year=${selectedYear}&semester=${selectedSemester}`),
        api.get(`/student/status?studentId=${sid}&deptCode=${selectedDept}&year=${selectedYear}&semester=${selectedSemester}`)
      ])

      setCourses(coursesRes.data)
      setCourseStatus(statusRes.data)
    } catch (err) {
      setError(err.message || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleCourseSelect = (course) => {
    // Store the full course object
    setSelectedCourse({
      ...course,
      _id: course._id || course.courseId
    })
    setSurveyAnswers({})
    setFeedbackAnswers({})
    setRecommendation('')
    setCurrentStep(3)
  }

  const handleSubmit = async () => {
    if (!selectedCourse) return

    try {
      setLoading(true)
      setError(null)

      const hasSurvey = selectedCourse.surveyQuestions?.length > 0
      const hasFeedback = selectedCourse.feedbackQuestions?.length > 0

      const surveyAnswersArray = hasSurvey
        ? selectedCourse.surveyQuestions.map(q => ({
            questionId: q.questionId,
            value: surveyAnswers[q.questionId]
          })).filter(a => a.value) // Only include answered questions
        : []

      const feedbackAnswersArray = hasFeedback
        ? selectedCourse.feedbackQuestions.map(q => ({
            questionId: q.questionId,
            value: feedbackAnswers[q.questionId]
          })).filter(a => a.value) // Only include answered questions
        : []

      if (surveyAnswersArray.length === 0 && feedbackAnswersArray.length === 0) {
        setError('Please answer at least one question')
        return
      }

      await api.post('/student/submit', {
        studentId,
        courseId: selectedCourse._id,
        surveyAnswers: surveyAnswersArray.length > 0 ? surveyAnswersArray : undefined,
        feedbackAnswers: feedbackAnswersArray.length > 0 ? feedbackAnswersArray : undefined,
        recommendation: recommendation.trim() || undefined
      })

      // Reload status
      await loadCourses()
      setCurrentStep(2)
      setSelectedCourse(null)
    } catch (err) {
      setError(err.message || 'Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <Card>
      <Title level={4}>Select Department, Year & Semester</Title>
      <Space direction='vertical' style={{ width: '100%' }} size='large'>
        <div>
          <Text strong>Department:</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder='Select Department'
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
        <div>
          <Text strong>Year:</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            value={selectedYear}
            onChange={setSelectedYear}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <Select.Option key={year} value={year}>{year}</Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <Text strong>Semester:</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            value={selectedSemester}
            onChange={setSelectedSemester}
          >
            <Select.Option value={1}>Semester 1</Select.Option>
            <Select.Option value={2}>Semester 2</Select.Option>
          </Select>
        </div>
        <Button type='primary' block onClick={handleStep1Next} loading={loading}>
          Continue
        </Button>
      </Space>
    </Card>
  )

  const renderStep2 = () => (
    <Card>
      <Title level={4}>Your Courses</Title>
      {studentId && (
        <Alert
          message={`Student ID: ${studentId}`}
          type='info'
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}
      {loading ? (
        <Spin />
      ) : (
        <Space direction='vertical' style={{ width: '100%' }} size='middle'>
            {courses.map((course, index) => {
            const courseId = course._id || course.courseId
            const courseIdStr = courseId?.toString()
            const status = courseStatus.find(s => {
              const statusCourseId = s.courseId?.toString()
              return statusCourseId === courseIdStr
            })
            const surveyDone = status?.surveySubmitted
            const feedbackDone = status?.feedbackSubmitted

            return (
              <Card
                key={courseId || index}
                title={course.courseCode}
                extra={
                  <Space>
                    {surveyDone && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    {feedbackDone && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  </Space>
                }
                style={{ cursor: 'pointer' }}
                onClick={() => handleCourseSelect({ ...course, _id: courseId })}
              >
                <Text>{course.courseName}</Text>
                <div style={{ marginTop: 8 }}>
                  <Text type='secondary' style={{ fontSize: '12px' }}>
                    Survey: {surveyDone ? 'Submitted' : 'Pending'} | 
                    Feedback: {feedbackDone ? 'Submitted' : 'Pending'}
                  </Text>
                </div>
              </Card>
            )
          })}
          {courses.length === 0 && (
            <Alert message='No active courses found' type='warning' />
          )}
        </Space>
      )}
    </Card>
  )

  const renderStep3 = () => {
    if (!selectedCourse) return null

    return (
      <Card>
        <Title level={4}>{selectedCourse.courseCode} - {selectedCourse.courseName}</Title>

        {/* Survey Questions */}
        {selectedCourse.surveyQuestions?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>Survey Questions</Title>
            <Space direction='vertical' style={{ width: '100%' }} size='large'>
              {selectedCourse.surveyQuestions.map(question => (
                <Card key={question.questionId} size='small'>
                  <Text strong>{question.text}</Text>
                  <Radio.Group
                    style={{ width: '100%', marginTop: 8 }}
                    value={surveyAnswers[question.questionId]}
                    onChange={(e) => setSurveyAnswers({
                      ...surveyAnswers,
                      [question.questionId]: e.target.value
                    })}
                  >
                    <Space direction='vertical'>
                      {Object.entries(LikertLabels).map(([value, label]) => (
                        <Radio key={value} value={parseInt(value)}>
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
        {selectedCourse.feedbackQuestions?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>Feedback Questions</Title>
            <Space direction='vertical' style={{ width: '100%' }} size='large'>
              {selectedCourse.feedbackQuestions.map(question => (
                <Card key={question.questionId} size='small'>
                  <Text strong>{question.text}</Text>
                  <Radio.Group
                    style={{ width: '100%', marginTop: 8 }}
                    value={feedbackAnswers[question.questionId]}
                    onChange={(e) => setFeedbackAnswers({
                      ...feedbackAnswers,
                      [question.questionId]: e.target.value
                    })}
                  >
                    <Space direction='vertical'>
                      {Object.entries(LikertLabels).map(([value, label]) => (
                        <Radio key={value} value={parseInt(value)}>
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
          <Title level={5}>Recommendation (Optional)</Title>
          <TextArea
            rows={4}
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            placeholder='Enter your recommendations or feedback...'
          />
        </div>

        <Space>
          <Button onClick={() => { setCurrentStep(2); setSelectedCourse(null) }}>
            Back
          </Button>
          <Button type='primary' onClick={handleSubmit} loading={loading}>
            Submit
          </Button>
        </Space>
      </Card>
    )
  }

  const steps = [
    {
      title: 'Select Details',
      content: renderStep1()
    },
    {
      title: 'Select Course',
      content: renderStep2()
    },
    {
      title: 'Submit Feedback',
      content: renderStep3()
    }
  ]

  return (
    <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
        Course Feedback & Survey
      </Title>

      {error && (
        <Alert
          message={error}
          type='error'
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step, index) => (
          <Step key={index} title={step.title} />
        ))}
      </Steps>

      <div style={{ minHeight: '400px' }}>
        {steps[currentStep].content}
      </div>
    </div>
  )
}

