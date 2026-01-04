const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

/**
 * API client for making requests to the backend
 */
class ApiClient {
  constructor (baseURL = API_URL) {
    this.baseURL = baseURL
  }

  async request (endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'An error occurred')
      }

      return data
    } catch (error) {
      throw error
    }
  }

  get (endpoint, options = {}) {
    // Handle query parameters
    let url = endpoint
    if (options.params) {
      const params = new URLSearchParams(options.params)
      url += `?${params.toString()}`
    }
    return this.request(url, { ...options, method: 'GET', params: undefined })
  }

  post (endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  put (endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  delete (endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }
}

export default new ApiClient()

