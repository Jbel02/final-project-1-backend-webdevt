import { http } from './client'

/* ===== API calls =====
   One function per endpoint in the proposal (plus the ➕ additions), each
   resolving to the response body. Pages import from here and never build
   URLs themselves. */

const body = (response) => response.data

export const authApi = {
  me: () => http.get('/auth/me').then(body),
  login: (values) => http.post('/auth/login', values).then(body),
  register: (values) => http.post('/auth/register', values).then(body),
  logout: () => http.post('/auth/logout').then(body),
}

export const roomsApi = {
  list: (params) => http.get('/rooms', { params }).then(body),
  get: (id, params) => http.get(`/rooms/${id}`, { params }).then(body),
  create: (values) => http.post('/rooms', values).then(body),
  update: (id, values) => http.put(`/rooms/${id}`, values).then(body),
  remove: (id) => http.delete(`/rooms/${id}`).then(body),
}

export const bookingsApi = {
  create: (values) => http.post('/bookings', values).then(body),
  mine: () => http.get('/bookings/mine').then(body),
  list: (params) => http.get('/bookings', { params }).then(body),
  get: (id) => http.get(`/bookings/${id}`).then(body),
  checkIn: (id) => http.patch(`/bookings/${id}/checkin`).then(body),
  checkOut: (id) => http.patch(`/bookings/${id}/checkout`).then(body),
  cancel: (id) => http.patch(`/bookings/${id}/cancel`).then(body),
}

export const usersApi = {
  list: (params) => http.get('/users', { params }).then(body),
  get: (id) => http.get(`/users/${id}`).then(body),
  createReceptionist: (values) => http.post('/users/receptionist', values).then(body),
  deactivate: (id) => http.patch(`/users/${id}/deactivate`).then(body),
  activate: (id) => http.patch(`/users/${id}/activate`).then(body),
  remove: (id) => http.delete(`/users/${id}`).then(body),
  updateMe: (values) => http.patch('/users/me', values).then(body),
}
