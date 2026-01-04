'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, Button, Space, Typography, Alert, Spin, Row, Col, Statistic, Divider } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons'
import api from '../../../lib/api'
import { LikertLabels } from '../../../lib/constants'

const { Title, Text } = Typography

export default function CourseDetailPage () {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id

  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)
  const [courseData, setCourseData] = useState(null)

  useEffect(() => {
    if (courseId) {
      loadCourseData()
    }
  }, [courseId])

  const loadCourseData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/admin')
        return
      }

      const response = await api.get(`/api/admin/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setCourseData(response.data)
    } catch (err) {
      setError(err.message || 'Failed to load course data')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadSamples = async () => {
    try {
      setDownloading(true)
      setError(null)

      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/admin')
        return
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${API_URL}/api/admin/course/${courseId}/samples`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        try {
          const jsonError = JSON.parse(errorData)
          throw new Error(jsonError.error?.message || 'Failed to download samples')
        } catch {
          throw new Error('Failed to download samples')
        }
      }

      // Get PDF blob
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `course_${courseData.courseCode}_samples.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err.message || 'Failed to download samples')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', background: '#f5f5f5' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size='large' />
            <div style={{ marginTop: 16 }}>
              <Text type='secondary'>Loading course data...</Text>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!courseData) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', background: '#f5f5f5' }}>
        <Card>
          <Alert
            message='Course not found'
            description='The course you are looking for does not exist.'
            type='error'
            action={
              <Button onClick={() => router.push('/admin')}>
                Go Back
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', background: '#f5f5f5' }}>
      <Card style={{ marginBottom: 16 }}>
        <Space direction='vertical' style={{ width: '100%' }} size='middle'>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/admin')}
          >
            Back to Admin
          </Button>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              {courseData.courseCode} - {courseData.courseName}
            </Title>
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Statistic
                title='Survey Submissions'
                value={courseData.survey.totalResponses}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Statistic
                title='Feedback Submissions'
                value={courseData.feedback.totalResponses}
              />
            </Col>
          </Row>
          <Button
            type='primary'
            icon={<DownloadOutlined />}
            onClick={handleDownloadSamples}
            loading={downloading}
          >
            Download Samples PDF (5 random submissions)
          </Button>
        </Space>
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

      {/* Survey Statistics */}
      {Object.keys(courseData.survey.questionStats).length > 0 && (
        <Card title='Survey Questions Statistics' style={{ marginBottom: 16 }}>
          <Space direction='vertical' style={{ width: '100%' }} size='large'>
            {Object.entries(courseData.survey.questionStats).map(([qId, stats]) => (
              <Card key={qId} size='small' style={{ background: '#fafafa' }}>
                <Text strong style={{ fontSize: '15px' }}>{stats.questionText}</Text>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={12}>
                    <Statistic
                      title='Average'
                      value={stats.average}
                      precision={2}
                      valueStyle={{ fontSize: '20px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title='Responses'
                      value={stats.count}
                      valueStyle={{ fontSize: '20px' }}
                    />
                  </Col>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <div>
                  <Text type='secondary' style={{ fontSize: '13px' }}>Distribution: </Text>
                  {Object.entries(stats.distribution).map(([value, count]) => (
                    <Text key={value} type='secondary' style={{ fontSize: '13px', marginRight: 12 }}>
                      {LikertLabels[value]}: {count}
                    </Text>
                  ))}
                </div>
              </Card>
            ))}
          </Space>
        </Card>
      )}

      {/* Feedback Statistics */}
      {Object.keys(courseData.feedback.questionStats).length > 0 && (
        <Card title='Feedback Questions Statistics'>
          <Space direction='vertical' style={{ width: '100%' }} size='large'>
            {Object.entries(courseData.feedback.questionStats).map(([qId, stats]) => (
              <Card key={qId} size='small' style={{ background: '#fafafa' }}>
                <Text strong style={{ fontSize: '15px' }}>{stats.questionText}</Text>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={12}>
                    <Statistic
                      title='Average'
                      value={stats.average}
                      precision={2}
                      valueStyle={{ fontSize: '20px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title='Responses'
                      value={stats.count}
                      valueStyle={{ fontSize: '20px' }}
                    />
                  </Col>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <div>
                  <Text type='secondary' style={{ fontSize: '13px' }}>Distribution: </Text>
                  {Object.entries(stats.distribution).map(([value, count]) => (
                    <Text key={value} type='secondary' style={{ fontSize: '13px', marginRight: 12 }}>
                      {LikertLabels[value]}: {count}
                    </Text>
                  ))}
                </div>
              </Card>
            ))}
          </Space>
        </Card>
      )}
    </div>
  )
}

