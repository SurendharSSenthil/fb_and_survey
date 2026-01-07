'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, Button, Space, Typography, Alert, Spin, Row, Col, Statistic, Divider, Table, Modal, Input } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined, LogoutOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import api from '../../../lib/api'
import { LikertLabels } from '../../../lib/constants'
import { Routes, API_ENDPOINTS, STORAGE_KEYS, Messages, UI, FEEDBACK_CATEGORIES, likertToPercentage, getCOLabel, getStudentsAbove60 } from '../../../lib/constants/index.js'
import AppLayout from '../../../components/AppLayout'
import ResponsiveLayout from '../../../components/ResponsiveLayout'

const { Title, Text } = Typography

export default function CourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id

  const [loading, setLoading] = useState(false)
  const [downloadingSurvey, setDownloadingSurvey] = useState(false)
  const [downloadingFeedback, setDownloadingFeedback] = useState(false)
  const [error, setError] = useState(null)
  const [courseData, setCourseData] = useState(null)

  const [isEditQuestionsOpen, setIsEditQuestionsOpen] = useState(false)
  const [questionEdits, setQuestionEdits] = useState({ surveyQuestions: [], feedbackQuestions: [] })
  const [savingQuestions, setSavingQuestions] = useState(false)

  useEffect(() => {
    if (courseId) {
      loadCourseData()
    }
  }, [courseId])

  const loadCourseData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
      if (!token) {
        router.push(Routes.ADMIN)
        return
      }

      const response = await api.get(API_ENDPOINTS.ADMIN.COURSE_DETAIL(courseId), {
        headers: { Authorization: `Bearer ${token}` }
      })

      setCourseData(response.data)
    } catch (err) {
      setError(err.message || Messages.ERROR_GENERIC)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
    router.push(Routes.ADMIN)
  }

  const openEditQuestions = () => {
    if (!courseData) return
    setQuestionEdits({
      surveyQuestions: courseData.surveyQuestions || [],
      feedbackQuestions: courseData.feedbackQuestions || []
    })
    setIsEditQuestionsOpen(true)
  }

  const addSurveyQuestion = () => {
    const questionId = `SQ${Date.now()}`
    setQuestionEdits(prev => ({
      ...prev,
      surveyQuestions: [...(prev.surveyQuestions || []), { questionId, text: '' }]
    }))
  }

  const removeSurveyQuestion = (index) => {
    setQuestionEdits(prev => ({
      ...prev,
      surveyQuestions: (prev.surveyQuestions || []).filter((_, i) => i !== index)
    }))
  }

  const addFeedbackQuestion = () => {
    const questionId = `FQ${Date.now()}`
    setQuestionEdits(prev => ({
      ...prev,
      feedbackQuestions: [...(prev.feedbackQuestions || []), { questionId, text: '' }]
    }))
  }

  const removeFeedbackQuestion = (index) => {
    setQuestionEdits(prev => ({
      ...prev,
      feedbackQuestions: (prev.feedbackQuestions || []).filter((_, i) => i !== index)
    }))
  }

  const handleSaveQuestions = async () => {
    try {
      setSavingQuestions(true)
      setError(null)

      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
      if (!token) {
        router.push(Routes.ADMIN)
        return
      }

      const surveyQuestions = (questionEdits.surveyQuestions || []).filter(q => q.text && q.text.trim())
      const feedbackQuestions = (questionEdits.feedbackQuestions || []).filter(q => q.text && q.text.trim())

      await api.put(API_ENDPOINTS.ADMIN.COURSE_UPDATE(courseId), {
        surveyQuestions,
        feedbackQuestions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setIsEditQuestionsOpen(false)
      await loadCourseData()
    } catch (err) {
      setError(err.message || Messages.ERROR_GENERIC)
    } finally {
      setSavingQuestions(false)
    }
  }

  const handleDownloadSurveySamples = async () => {
    try {
      setDownloadingSurvey(true)
      setError(null)

      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
      if (!token) {
        router.push(Routes.ADMIN)
        return
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${API_URL}${API_ENDPOINTS.ADMIN.COURSE_SAMPLES_SURVEY(courseId)}`, {
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

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `course_${courseData.courseCode}_survey_samples.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err.message || 'Failed to download survey samples')
    } finally {
      setDownloadingSurvey(false)
    }
  }

  const handleDownloadFeedbackSamples = async () => {
    try {
      setDownloadingFeedback(true)
      setError(null)

      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
      if (!token) {
        router.push(Routes.ADMIN)
        return
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${API_URL}${API_ENDPOINTS.ADMIN.COURSE_SAMPLES_FEEDBACK(courseId)}`, {
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

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `course_${courseData.courseCode}_feedback_samples.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err.message || 'Failed to download feedback samples')
    } finally {
      setDownloadingFeedback(false)
    }
  }

  const handleDeleteCourse = () => {
    Modal.confirm({
      title: 'Delete course?',
      content: 'This will delete the course and its submitted survey/feedback responses.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true)
          setError(null)

          const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
          if (!token) {
            router.push(Routes.ADMIN)
            return
          }

          await api.delete(API_ENDPOINTS.ADMIN.COURSE_DELETE(courseId), {
            headers: { Authorization: `Bearer ${token}` }
          })

          router.push(Routes.ADMIN)
        } catch (err) {
          setError(err.message || 'Failed to delete course')
          setLoading(false)
        }
      }
    })
  }

  // Prepare survey table data with CO mapping
  const getSurveyTableData = () => {
    if (!courseData?.survey?.questionStats) return []

    return Object.entries(courseData.survey.questionStats).map(([qId, stats], index) => {
      const percentage = likertToPercentage(stats.average)
      const studentsAbove60 = getStudentsAbove60(stats.distribution)
      return {
        key: qId,
        question: stats.questionText,
        co: getCOLabel(index),
        average: stats.average.toFixed(2),
        percentage: percentage.toFixed(2),
        responses: stats.count,
        studentsAbove60,
        distribution: stats.distribution
      }
    })
  }

  // Prepare feedback category table data
  const getFeedbackCategoryData = () => {
    if (!courseData?.feedback?.questionStats) return []

    return FEEDBACK_CATEGORIES.map(category => {
      const categoryQuestions = category.questions
      const categoryStats = categoryQuestions
        .map(qId => courseData.feedback.questionStats[qId])
        .filter(Boolean)

      if (categoryStats.length === 0) return null

      const categoryAverage = categoryStats.reduce((sum, stat) => sum + stat.average, 0) / categoryStats.length
      const categoryPercentage = likertToPercentage(categoryAverage)
      const totalResponses = categoryStats.reduce((sum, stat) => sum + stat.count, 0)

      return {
        key: category.id,
        category: category.name,
        questions: categoryQuestions.length,
        average: categoryAverage.toFixed(2),
        percentage: categoryPercentage.toFixed(2),
        responses: totalResponses / categoryQuestions?.length
      }
    }).filter(Boolean)
  }

  const surveyColumns = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      width: '35%',
      ellipsis: true
    },
    {
      title: 'CO',
      dataIndex: 'co',
      key: 'co',
      width: '8%',
      align: 'center'
    },
    {
      title: 'Average (1-5)',
      dataIndex: 'average',
      key: 'average',
      width: '12%',
      align: 'center'
    },
    {
      title: 'Mark (out of 100)',
      dataIndex: 'percentage',
      key: 'percentage',
      width: '12%',
      align: 'center',
      render: (value) => <Text strong>{value}%</Text>
    },
    {
      title: 'Students >60%',
      dataIndex: 'studentsAbove60',
      key: 'studentsAbove60',
      width: '12%',
      align: 'center',
      render: (value, record) => (
        <Text style={{ color: value > 0 ? '#52c41a' : '#ff4d4f' }}>
          {value}/{record.responses}
        </Text>
      )
    },
    {
      title: 'Total Responses',
      dataIndex: 'responses',
      key: 'responses',
      width: '11%',
      align: 'center'
    }
  ]

  const feedbackCategoryColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '30%'
    },
    {
      title: 'Questions',
      dataIndex: 'questions',
      key: 'questions',
      width: '15%',
      align: 'center'
    },
    {
      title: 'Average (1-5)',
      dataIndex: 'average',
      key: 'average',
      width: '15%',
      align: 'center'
    },
    {
      title: 'Average (out of 100)',
      dataIndex: 'percentage',
      key: 'percentage',
      width: '20%',
      align: 'center',
      render: (value) => <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>{value}%</Text>
    },
    {
      title: 'Total Responses',
      dataIndex: 'responses',
      key: 'responses',
      width: '20%',
      align: 'center'
    }
  ]

  if (loading) {
    return (
      <div className='student-content' style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', background: UI.COLORS.BACKGROUND }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size='large' />
            <div style={{ marginTop: 16 }}>
              <Text type='secondary'>{Messages.COURSE_LOADING}</Text>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!courseData) {
    return (
      <div className='student-content' style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', background: UI.COLORS.BACKGROUND }}>
        <Card>
          <Alert
            message={Messages.COURSE_NOT_FOUND}
            description={Messages.COURSE_NOT_FOUND_DESC}
            type='error'
            action={
              <Button onClick={() => router.push(Routes.ADMIN)}>
                Go Back
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  const surveyTableData = getSurveyTableData()
  const feedbackCategoryData = getFeedbackCategoryData()

  return (
    <AppLayout
      showHeader={true}
      showFooter={true}
      headerContent={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Title level={3} style={{ color: '#fff', margin: 0 }}>
            Admin Dashboard
          </Title>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>Logout</Button>
        </div>
      }
    >
      <ResponsiveLayout maxWidth={UI.LAYOUT.MAX_WIDTH.WIDE}>
        <Card style={{ marginBottom: 16 }}>
          <Space direction='vertical' style={{ width: '100%' }} size='middle'>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push(Routes.ADMIN)}
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
            <Space wrap>
              <Button onClick={openEditQuestions}>
                Edit Questions
              </Button>
              <Button
                type='primary'
                icon={<DownloadOutlined />}
                onClick={handleDownloadSurveySamples}
                loading={downloadingSurvey}
              >
                Download Survey Samples
              </Button>
              <Button
                type='primary'
                icon={<DownloadOutlined />}
                onClick={handleDownloadFeedbackSamples}
                loading={downloadingFeedback}
              >
                Download Feedback Samples
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteCourse}
              >
                Delete Course
              </Button>
            </Space>
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

        {/* Survey Statistics Table */}
        {surveyTableData.length > 0 && (
          <Card title='Survey Questions - Course Outcomes Analysis' style={{ marginBottom: 16 }}>
            <div style={{ overflowX: 'auto' }}>
              <Table
                columns={surveyColumns}
                dataSource={surveyTableData}
                pagination={false}
                size='middle'
                scroll={{ x: 800 }}
              />
            </div>
            <Divider />
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Statistic
                  title='Total Questions'
                  value={surveyTableData.length}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title='Overall Average'
                  value={surveyTableData.reduce((sum, row) => sum + parseFloat(row.average), 0) / surveyTableData.length}
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title='Overall Percentage'
                  value={surveyTableData.reduce((sum, row) => sum + parseFloat(row.percentage), 0) / surveyTableData.length}
                  precision={2}
                  suffix='%'
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* Feedback Category Statistics Table */}
        {feedbackCategoryData.length > 0 && (
          <Card title='Feedback Questions - Category Analysis' style={{ marginBottom: 16 }}>
            <div style={{ overflowX: 'auto' }}>
              <Table
                columns={feedbackCategoryColumns}
                dataSource={feedbackCategoryData}
                pagination={false}
                size='middle'
                scroll={{ x: 800 }}
              />
            </div>
            <Divider />
            <Row gutter={16}>
              <Col xs={24} sm={6}>
                <Statistic
                  title='Total Categories'
                  value={feedbackCategoryData.length}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title='Overall Average'
                  value={feedbackCategoryData.reduce((sum, row) => sum + parseFloat(row.average), 0) / feedbackCategoryData.length}
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title='Overall Percentage'
                  value={feedbackCategoryData.reduce((sum, row) => sum + parseFloat(row.percentage), 0) / feedbackCategoryData.length}
                  precision={2}
                  suffix='%'
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title='Total Responses'
                  value={feedbackCategoryData.reduce((sum, row) => sum + row.responses, 0)}
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* Detailed Feedback Question Statistics (Collapsible) */}
        {Object.keys(courseData.feedback.questionStats).length > 0 && (
          <Card title='Detailed Feedback Question Statistics' style={{ marginBottom: 16 }}>
            <Space direction='vertical' style={{ width: '100%' }} size='middle'>
              {FEEDBACK_CATEGORIES.map(category => {
                const categoryQuestions = category.questions
                  .map(qId => {
                    const stats = courseData.feedback.questionStats[qId]
                    return stats ? { questionId: qId, ...stats } : null
                  })
                  .filter(Boolean)

                if (categoryQuestions.length === 0) return null

                return (
                  <Card key={category.id} size='small' style={{ background: '#fafafa' }}>
                    <Title level={5} style={{ marginBottom: 12 }}>{category.name}</Title>
                    <Space direction='vertical' style={{ width: '100%' }} size='small'>
                      {categoryQuestions.map((stats, index) => (
                        <div key={stats.questionId} style={{ padding: '8px 0', borderBottom: index < categoryQuestions.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                          <Row gutter={16} align='middle'>
                            <Col xs={24} sm={14}>
                              <Text strong style={{ fontSize: '13px' }}>{stats.questionText}</Text>
                            </Col>
                            <Col xs={12} sm={5}>
                              <Statistic
                                title='Average'
                                value={stats.average}
                                precision={2}
                                valueStyle={{ fontSize: '14px' }}
                              />
                            </Col>
                            <Col xs={12} sm={5}>
                              <Statistic
                                title='Percentage'
                                value={likertToPercentage(stats.average)}
                                precision={2}
                                suffix='%'
                                valueStyle={{ fontSize: '14px', color: '#1890ff' }}
                              />
                            </Col>
                          </Row>
                        </div>
                      ))}
                    </Space>
                  </Card>
                )
              })}
            </Space>
          </Card>
        )}

        <Modal
          title='Edit Course Questions'
          open={isEditQuestionsOpen}
          onCancel={() => setIsEditQuestionsOpen(false)}
          onOk={handleSaveQuestions}
          okText='Save'
          confirmLoading={savingQuestions}
          width={900}
        >
          <Divider>Survey Questions</Divider>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <Button icon={<PlusOutlined />} onClick={addSurveyQuestion}>
              Add Survey Question
            </Button>
          </div>
          <Space direction='vertical' style={{ width: '100%' }} size='small'>
            {(questionEdits.surveyQuestions || []).map((q, idx) => (
              <div key={q.questionId} style={{ display: 'flex', gap: 8 }}>
                <Input
                  value={q.text}
                  onChange={(e) => {
                    const updated = [...questionEdits.surveyQuestions]
                    updated[idx] = { ...updated[idx], text: e.target.value }
                    setQuestionEdits({ ...questionEdits, surveyQuestions: updated })
                  }}
                  placeholder={`Survey Question ${idx + 1}`}
                />
                <Button danger icon={<DeleteOutlined />} onClick={() => removeSurveyQuestion(idx)} />
              </div>
            ))}
            {(!questionEdits.surveyQuestions || questionEdits.surveyQuestions.length === 0) && (
              <Alert type='info' message='No survey questions configured for this course.' />
            )}
          </Space>

          <Divider>Feedback Questions</Divider>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <Button icon={<PlusOutlined />} onClick={addFeedbackQuestion}>
              Add Feedback Question
            </Button>
          </div>
          <Space direction='vertical' style={{ width: '100%' }} size='small'>
            {(questionEdits.feedbackQuestions || []).map((q, idx) => (
              <div key={q.questionId} style={{ display: 'flex', gap: 8 }}>
                <Input
                  value={q.text}
                  onChange={(e) => {
                    const updated = [...questionEdits.feedbackQuestions]
                    updated[idx] = { ...updated[idx], text: e.target.value }
                    setQuestionEdits({ ...questionEdits, feedbackQuestions: updated })
                  }}
                  placeholder={`Feedback Question ${idx + 1}`}
                />
                <Button danger icon={<DeleteOutlined />} onClick={() => removeFeedbackQuestion(idx)} />
              </div>
            ))}
            {(!questionEdits.feedbackQuestions || questionEdits.feedbackQuestions.length === 0) && (
              <Alert type='info' message='No feedback questions configured for this course.' />
            )}
          </Space>
        </Modal>
      </ResponsiveLayout>
    </AppLayout>
  )
}
