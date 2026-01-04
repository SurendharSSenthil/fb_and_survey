'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Radio, Button, Space, Typography, Alert, Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import api from '../../lib/api'
import { getStudentSession } from '../../lib/utils'
import { LikertLabels } from '../../lib/constants'

const { Title, Text } = Typography

export default function SurveyPage () {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [course, setCourse] = useState(null)
  const [answers, setAnswers] = useState({})
  const [studentId, setStudentId] = useState(null)

  useEffect(() => {
    const session = getStudentSession()
    if (!session) {
      router.push('/student')
      return
    }
    setStudentId(session.studentId)

    if (courseId) {
      loadCourse()
    } else {
      setError('Course ID is required')
    }
  }, [courseId])

  const loadCourse = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get course data from localStorage (set when navigating from student page)
      const courseData = JSON.parse(localStorage.getItem(`course_${courseId}`) || 'null')
      if (courseData) {
        setCourse(courseData)
      } else {
        setError('Course not found. Please go back and try again.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!course || !studentId) return

    const surveyQuestions = course.surveyQuestions || []
    const answeredQuestions = surveyQuestions.filter(q => answers[q.questionId])

    if (answeredQuestions.length === 0) {
      setError('Please answer at least one question')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const surveyAnswersArray = answeredQuestions.map(q => ({
        questionId: q.questionId,
        value: answers[q.questionId]
      }))

      await api.post('/api/student/submit', {
        studentId,
        courseId: course._id || courseId,
        surveyAnswers: surveyAnswersArray
      })

      router.push('/student')
    } catch (err) {
      setError(err.message || 'Failed to submit survey')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh', background: '#f5f5f5' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size='large' />
            <div style={{ marginTop: 16 }}>
              <Text type='secondary'>Loading survey...</Text>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!course) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh', background: '#f5f5f5' }}>
        <Card>
          <Alert
            message='Course not found'
            description='Please go back and select a course again.'
            type='error'
            action={
              <Button onClick={() => router.push('/student')}>
                Go Back
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh', background: '#f5f5f5' }}>
      <Card style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/student')}
          style={{ marginBottom: 16 }}
        >
          Back to Courses
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          {course.courseCode} - {course.courseName}
        </Title>
        <Text type='secondary'>Survey Questions</Text>
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

      <Card>
        <Space direction='vertical' style={{ width: '100%' }} size='large'>
          {course.surveyQuestions?.map((question, index) => (
            <Card key={question.questionId} size='small' style={{ background: '#fafafa' }}>
              <Text strong style={{ fontSize: '15px' }}>
                {index + 1}. {question.text}
              </Text>
              <Radio.Group
                style={{ width: '100%', marginTop: 12 }}
                value={answers[question.questionId]}
                onChange={(e) => setAnswers({
                  ...answers,
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

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <Button onClick={() => router.push('/student')}>
            Cancel
          </Button>
          <Button type='primary' onClick={handleSubmit} loading={submitting} size='large'>
            Submit Survey
          </Button>
        </div>
      </Card>
    </div>
  )
}

