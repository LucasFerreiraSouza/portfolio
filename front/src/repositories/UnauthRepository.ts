import { AxiosRequestConfig } from 'axios'
import { Repository } from '../services/Repository'
import { api } from '../services/api'

class UnauthRepository extends Repository {
  // Pode continuar usando para endpoints públicos que não precisam de JWT
  sendPushNotification = async (data: any, config?: AxiosRequestConfig) => {
    return this.handle(() =>
      this.api.post(`${this.path}`, data, config)
    )
  }
}

export default new UnauthRepository({
  path: 'unauth/web-push',
  api: api
})
