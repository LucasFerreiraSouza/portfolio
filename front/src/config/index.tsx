const env = import.meta.env.REACT_APP_ENV || import.meta.env.VITE_ENV
export const server =
  import.meta.env.REACT_APP_SERVER || import.meta.env.VITE_SERVER || ''

export const isProduction = env === 'production'
export const isDevelopment = env === 'development'
export const isLocal = !isProduction && !isDevelopment
