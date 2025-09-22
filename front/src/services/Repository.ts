import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { IResponseBase } from './serviceInterfaces'

export class ErrInternetDisconnected extends Error {
  name = 'ERR_INTERNET_DISCONNECTED'
  message = 'Verifique sua conexão com a internet.'
}

export class ConnectionFailed extends Error {
  name = 'CONNECTION_FAILED'
  message = 'Por favor, tente novamente mais tarde.'
}
export class CookiesBlocked extends Error {
  name = 'Cookies_Blocked'
  message =
    'Cookies Bloqueados: esse página necessita de acesso aos cookies para seu funcionamento.'
}

export class ResourceNotFound extends Error {
  name = 'RESOURCE_NOT_FOUND'
  message = 'Nenhuma item encontrado, verifique sua conexão.'
}

interface IRepository {
  api: AxiosInstance
  path: string
}

export type IErrorForm<T> = { [Key in keyof T]?: string }

export class Repository {
  protected api: AxiosInstance
  protected path: string

  constructor({ api, path }: IRepository) {
    this.api = api
    this.path = path
  }

  async handle<T>(
    request: () => Promise<AxiosResponse>
  ): Promise<IResponseBase<T>> {
    try {
      const response: AxiosResponse = await request()

      return response
    } catch (err: any) {
      if (axios.isCancel(err)) throw err
      if (err.name === 'ERR_INTERNET_DISCONNECTED')
        throw new ErrInternetDisconnected()
      if (!err.response) throw new ConnectionFailed()
      throw err.response.data
    }
  }
}
