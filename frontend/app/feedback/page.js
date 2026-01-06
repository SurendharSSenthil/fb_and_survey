'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Radio, Button, Input, Space, Typography, Alert, Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import api from '../../lib/api'
import { getStudentSession } from '../../lib/utils'
import { LikertLabels } from '../../lib/constants'
import { STANDARD_FEEDBACK_QUESTIONS } from '../../lib/standardFeedbackQuestions'
import AppLayout from '../../components/AppLayout'
import ResponsiveLayout from '../../components/ResponsiveLayout'

const { Title, Text } = Typography
const { TextArea } = Input

export default function FeedbackPage () {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [course, setCourse] = useState(null)
  const [answers, setAnswers] = useState({})
  const [recommendation, setRecommendation] = useState('')
  const [studentId, setStudentId] = useState(null)

  const likertOrder = [5, 4, 3, 2, 1]

  const feedbackQuestions = course && course.feedbackQuestions && course.feedbackQuestions.length > 0
    ? course.feedbackQuestions
    : STANDARD_FEEDBACK_QUESTIONS

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

    const unanswered = feedbackQuestions.filter(q => !answers[q.questionId])
    if (feedbackQuestions.length > 0 && unanswered.length > 0) {
      setError('Please answer all questions')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const feedbackAnswersArray = feedbackQuestions.map(q => ({
        questionId: q.questionId,
        value: answers[q.questionId]
      }))

      await api.post('/api/student/submit', {
        studentId,
        courseId: course._id || courseId,
        feedbackAnswers: feedbackAnswersArray,
        recommendation: recommendation.trim() || undefined
      })

      router.push('/student')
    } catch (err) {
      setError(err.message || 'Failed to submit feedback')
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
                <Text type='secondary'>Loading feedback form...</Text>
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
          <Text type='secondary' style={{ fontSize: '13px' }}>Feedback Questions</Text>
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
            {feedbackQuestions.map((question, index) => (
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

          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <Title level={5} style={{ marginBottom: 8, fontSize: '14px' }}>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <Button onClick={() => router.push('/student')}>
              Cancel
            </Button>
            <Button type='primary' onClick={handleSubmit} loading={submitting} size='large'>
              Submit Feedback
            </Button>
          </div>
        </Card>
      </ResponsiveLayout>
    </AppLayout>
  )
}

