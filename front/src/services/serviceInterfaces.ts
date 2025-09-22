import { AxiosResponse } from 'axios'

export interface IResponseBase<T = unknown> extends AxiosResponse {
  data: T;
  error?: string;
}
