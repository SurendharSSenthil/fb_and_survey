'use client'

import { Card, Row, Col } from 'antd'
import { UI } from '../lib/constants/index.js'

export default function ResponsiveLayout ({ 
  children, 
  maxWidth = UI.LAYOUT.MAX_WIDTH.WIDE,
  centered = true,
  padding = `${UI.SPACING.MD}px`,
  background = UI.COLORS.BACKGROUND
}) {
  const containerStyle = {
    padding,
    maxWidth: centered ? maxWidth : '100%',
    margin: centered ? '0 auto' : '0',
    width: '100%',
    minHeight: '100vh',
    background
  }

  return (
    <div style={containerStyle}>
      {children}
    </div>
  )
}

// Responsive grid helper
export const ResponsiveGrid = ({ children, gutter = [16, 16], ...props }) => {
  return (
    <Row gutter={gutter} {...props}>
      {children}
    </Row>
  )
}

// Responsive column helper
export const ResponsiveCol = ({ children, xs = 24, sm = 12, md = 8, lg = 6, xl = 6, ...props }) => {
  return (
    <Col xs={xs} sm={sm} md={md} lg={lg} xl={xl} {...props}>
      {children}
    </Col>
  )
}

// Responsive card wrapper
export const ResponsiveCard = ({ children, style = {}, ...props }) => {
  const cardStyle = {
    height: '100%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    ...style
  }

  return (
    <Card style={cardStyle} {...props}>
      {children}
    </Card>
  )
}
