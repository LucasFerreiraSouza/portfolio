import { BrowserRouter } from 'react-router-dom'
import { HttpsRedirect } from './providers/HttpsRedirect'
import RootRoutes from './routes'

import './styles/index.scss'
import { ConfigProvider } from 'antd'
import { SystemProvider } from './hooks/useSystemContext'

function App() {
  return (
    <ConfigProvider theme={{ hashed: false }}>
      <BrowserRouter>
        <HttpsRedirect>
          <SystemProvider>
            <RootRoutes />
          </SystemProvider>
        </HttpsRedirect>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App