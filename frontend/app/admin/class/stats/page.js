'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Layout, Card, Table, Typography, Button, Space, Spin, Row, Col, Statistic, message } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import api from '../../../../lib/api'
import { FEEDBACK_CATEGORIES, likertToPercentage, getCOLabel, getStudentsAbove60 } from '../../../../lib/constants/feedbackCategories'
import { UI } from '../../../../lib/constants'

import AppLayout from '../../../../components/AppLayout'

const { Title, Text } = Typography

function ClassStatsContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const deptCode = searchParams.get('deptCode')
    const year = searchParams.get('year')
    const semester = searchParams.get('semester')

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState([])
    const [surveyColumns, setSurveyColumns] = useState([])

    // Verify admin access
    useEffect(() => {
        const token = localStorage.getItem('adminToken')
        if (!token) {
            router.push('/login')
        }
    }, [router])

    const fetchData = async () => {
        try {
            setLoading(true)

            const token = localStorage.getItem('adminToken')
            const response = await api.get(`/api/admin/report?deptCode=${deptCode}&year=${year}&semester=${semester}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            setData(response.data)

            // Determine max survey questions to set columns dynamically
            let maxSurveyQuestions = 0
            response.data.forEach(course => {
                if (course.survey?.questionStats) {
                    const qCount = Object.keys(course.survey.questionStats).length
                    if (qCount > maxSurveyQuestions) maxSurveyQuestions = qCount
                }
            })

            // Generate Survey Columns (CO1, CO2, etc.)
            const cols = [
                {
                    title: 'Course',
                    dataIndex: 'course',
                    key: 'course',
                    fixed: 'left',
                    width: 150,
                    render: (text, record) => (
                        <Space direction="vertical" size={0}>
                            <Text strong>{record.courseCode}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>{record.courseName}</Text>
                        </Space>
                    )
                }
            ]

            for (let i = 0; i < maxSurveyQuestions; i++) {
                cols.push({
                    title: getCOLabel(i),
                    dataIndex: `co${i + 1}`,
                    key: `co${i + 1}`,
                    align: 'center',
                    render: (item) => {
                        if (!item) return '-'
                        return (
                            <Space direction="vertical" size={0} style={{ width: '100%', textAlign: 'center' }}>
                                <Text style={{
                                    color: item.average >= 4 ? UI.COLORS.SUCCESS : item.average >= 3 ? UI.COLORS.WARNING : UI.COLORS.ERROR,
                                    fontWeight: 'bold',
                                    fontSize: 16
                                }}>
                                    {item.percentage.toFixed(0)}%
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    (≥60%: {item.above60})
                                </Text>
                            </Space>
                        )
                    }
                })
            }

            setSurveyColumns(cols)

        } catch (err) {
            message.error(err.message || 'Failed to fetch class data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (deptCode && year && semester) {
            fetchData()
        }
    }, [deptCode, year, semester])

    const handleDownloadPDF = async (type) => {
        try {
            const token = localStorage.getItem('adminToken')
            const response = await fetch(`${api.baseURL}/api/admin/report/pdf?deptCode=${deptCode}&year=${year}&semester=${semester}&type=${type}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!response.ok) throw new Error('Failed to generate PDF')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${deptCode}_${year}_Sem${semester}_${type}_Report.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err) {
            message.error(err.message || 'Failed to download PDF')
        }
    }

    // Process Feedback Data
    const getFeedbackDataSource = () => {
        return data.map(course => {
            const row = {
                key: course.courseId,
                courseCode: course.courseCode,
                courseName: course.courseName,
            }

            // Calculate category averages
            FEEDBACK_CATEGORIES.forEach(cat => {
                let totalScore = 0
                let questionCount = 0

                cat.questions.forEach(qId => {
                    const stat = course.feedback?.questionStats?.[qId]
                    if (stat) {
                        totalScore += stat.average
                        questionCount++
                    }
                })

                row[cat.id] = questionCount > 0 ? (totalScore / questionCount) : 0
            })

            return row
        })
    }

    // Process Survey Data
    const getSurveyDataSource = () => {
        return data.map(course => {
            const row = {
                key: course.courseId,
                courseCode: course.courseCode,
                courseName: course.courseName,
            }

            // Map Q1->CO1, Q2->CO2, etc. based on sorted keys or explicit IDs if standard
            // Assuming standard survey questions or sequential ordering
            if (course.survey?.questionStats) {
                // Sort question IDs to ensure consistent mapping
                const qIds = Object.keys(course.survey.questionStats).sort()

                qIds.forEach((qId, index) => {
                    const stat = course.survey.questionStats[qId]
                    row[`co${index + 1}`] = {
                        average: stat.average,
                        percentage: stat.average * 20,
                        above60: ((getStudentsAbove60(stat.distribution) / stat.count) * 100).toFixed(0)
                    }
                })
            }

            return row
        })
    }

    const feedbackColumns = [
        {
            title: 'Course',
            dataIndex: 'course',
            key: 'course',
            fixed: 'left',
            width: 150,
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.courseCode}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.courseName}</Text>
                </Space>
            )
        },
        ...FEEDBACK_CATEGORIES.map(cat => ({
            title: cat.name,
            dataIndex: cat.id,
            key: cat.id,
            align: 'center',
            render: (value) => (
                <Space direction="vertical" size={0}>
                    <Text style={{
                        color: value >= 4 ? UI.COLORS.SUCCESS : value >= 3 ? UI.COLORS.WARNING : UI.COLORS.ERROR,
                        fontWeight: 'bold',
                        fontSize: 16
                    }}>
                        {likertToPercentage(value).toFixed(0)}%
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {value.toFixed(2)}
                    </Text>
                </Space>
            )
        }))
    ]

    const headerContent = (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
                <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} ghost>
                    Back
                </Button>
            </Space>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>Class Report</Title>
            <Space>
                <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} ghost>
                    Refresh
                </Button>
            </Space>
        </div>
    )

    return (
        <AppLayout headerContent={headerContent}>
            <div style={{ padding: 24, background: UI.COLORS.BACKGROUND, minHeight: '100vh' }}>

                <Card style={{ marginBottom: 24 }}>
                    <Row gutter={24} align="middle">
                        <Col span={8}>
                            <Statistic title="Department" value={deptCode} />
                        </Col>
                        <Col span={8}>
                            <Statistic title="Year" value={year} formatter={(value) => String(value)} />
                        </Col>
                        <Col span={8}>
                            <Statistic title="Semester" value={semester} />
                        </Col>
                    </Row>
                </Card>



                {loading ? (
                    <div style={{ textAlign: 'center', padding: 50 }}>
                        <Spin size="large" tip="Loading class data..." />
                    </div>
                ) : (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>

                        <Card
                            title={<Title level={4}>Feedback Analysis (By Category)</Title>}
                            extra={<Button onClick={() => handleDownloadPDF('feedback')}>Export PDF</Button>}
                            bordered={false}
                            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        >
                            <Table
                                columns={feedbackColumns}
                                dataSource={getFeedbackDataSource()}
                                pagination={false}
                                scroll={{ x: true }}
                                bordered
                                size="middle"
                            />
                        </Card>

                        <Card
                            title={<Title level={4}>Survey Analysis (Course Outcomes)</Title>}
                            extra={<Button onClick={() => handleDownloadPDF('survey')}>Export PDF</Button>}
                            bordered={false}
                            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        >
                            <Table
                                columns={surveyColumns}
                                dataSource={getSurveyDataSource()}
                                pagination={false}
                                scroll={{ x: true }}
                                bordered
                                size="middle"
                            />
                        </Card>
                    </Space>
                )}
            </div>
        </AppLayout>
    )
}

export default function ClassStatsPage() {
    return (
        <Suspense fallback={<div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>}>
            <ClassStatsContent />
        </Suspense>
    )
}
