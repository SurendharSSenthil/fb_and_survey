'use client'

import { Layout, Typography } from 'antd'
import { usePathname } from 'next/navigation'
import { Messages, UI } from '../lib/constants/index.js'

const { Header, Footer } = Layout
const { Title, Text } = Typography

export default function AppLayout ({ children, showHeader = true, showFooter = true, headerContent = null, customHeaderStyle = {} }) {
  const pathname = usePathname()
  
  // Determine if this is an admin page
  const isAdminPage = pathname?.startsWith('/admin') || pathname?.startsWith('/course')
  
  // Default header content
  const defaultHeaderContent = (
    <Title level={3} style={{ 
      color: '#fff', 
      margin: 0, 
      fontSize: UI.FONT_SIZES.XXL,
      textAlign: 'center'
    }}>
      {Messages.SYSTEM_NAME}
    </Title>
  )

  return (
    <Layout style={{ minHeight: '100vh', background: UI.COLORS.BACKGROUND }}>
      {showHeader && (
        <Header style={{ 
          background: isAdminPage ? '#001529' : UI.COLORS.PRIMARY, 
          padding: `0 ${UI.SPACING.MD}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: headerContent ? 'space-between' : 'center',
          flexWrap: 'wrap',
          gap: `${UI.SPACING.SM}px`,
          minHeight: UI.LAYOUT.HEADER_HEIGHT,
          ...customHeaderStyle
        }}>
          {headerContent || defaultHeaderContent}
        </Header>
      )}
      
      <Layout.Content style={{ 
        padding: `${UI.SPACING.MD}px`,
        width: '100%',
        maxWidth: '100%',
        minHeight: showHeader && showFooter ? 'calc(100vh - 128px)' : 'auto'
      }}>
        {children}
      </Layout.Content>
      
      {showFooter && (
        <Footer style={{ 
          textAlign: 'center', 
          background: UI.COLORS.FOOTER_BG, 
          padding: `${UI.SPACING.SM}px`
        }}>
          <Text type='secondary' style={{ fontSize: UI.FONT_SIZES.SM }}>
            {Messages.SYSTEM_NAME}
          </Text>
        </Footer>
      )}
    </Layout>
  )
}
