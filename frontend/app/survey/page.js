'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Radio, Button, Space, Typography, Alert, Spin, notification } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import api from '../../lib/api'
import { getStudentSession } from '../../lib/utils'
import { LikertLabels } from '../../lib/constants'
import AppLayout from '../../components/AppLayout'
import ResponsiveLayout from '../../components/ResponsiveLayout'

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

  const likertOrder = [5, 4, 3, 2, 1]

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

    const unanswered = surveyQuestions.filter(
  q => !answers[q.questionId] 
)

if (unanswered.length > 0) {
  notification.error({
    message: 'Incomplete survey!',
    description: 'Please answer all questions before submitting.',
    placement: 'topRight',
  })
  return
}


    try {
      setSubmitting(true)
      setError(null)

      const surveyAnswersArray = surveyQuestions.map(q => ({
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
      <AppLayout>
        <ResponsiveLayout maxWidth="800px">
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size='large' />
              <div style={{ marginTop: 16 }}>
                <Text type='secondary'>Loading survey...</Text>
              </div>
            </div>
          </Card>
        </ResponsiveLayout>
      </AppLayout>
    )
  }

  if (!course) {
    return (
      <AppLayout>
        <ResponsiveLayout maxWidth="800px">
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
        </ResponsiveLayout>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <ResponsiveLayout maxWidth="800px">
        <Card style={{ marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/student')}
            style={{ marginBottom: 12 }}
          >
            Back to Courses
          </Button>
          <Title level={2} style={{ margin: 0, fontSize: '18px' }}>
            {course.courseCode} - {course.courseName}
          </Title>
          <Text type='secondary' style={{ fontSize: '13px' }}>Survey Questions</Text>
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
          <Space direction='vertical' style={{ width: '100%' }} size='middle'>
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
                    {likertOrder.map((value) => (
                      <Radio key={value} value={value} style={{ display: 'block', padding: '4px 0' }}>
                        {LikertLabels[value]}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Card>
            ))}
          </Space>

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <Button onClick={() => router.push('/student')}>
              Cancel
            </Button>
            <Button type='primary' onClick={handleSubmit} loading={submitting} size='large'>
              Submit Survey
            </Button>
          </div>
        </Card>
      </ResponsiveLayout>
    </AppLayout>
  )
}

