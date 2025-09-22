
import { ReactNode, useEffect } from 'react'
import { isProduction } from '../config'

export function HttpsRedirect({ children }: { children: ReactNode }) {
  useEffect(() => {
    const location = window?.location || {}
    const canRedirectToHttps = location.protocol === 'http:' && isProduction

    if (canRedirectToHttps) {
      location.assign(`https://${location.host}${location.pathname}`)
    }
  }, [])
  return children
}
