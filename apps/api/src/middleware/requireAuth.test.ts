import { describe, it, expect, vi } from 'vitest'
import { type Request, type Response } from 'express'
import { requireAuth } from './requireAuth.js'
import { generateAccessToken } from '../lib/tokens.js'

const mockReq = (headers: Record<string, string> = {}) => ({ headers }) as unknown as Request

const mockRes = () => ({}) as Response

describe('requireAuth', () => {
  it('attaches user to request for valid token', () => {
    const token = generateAccessToken('user-123', 'user')
    const req = mockReq({ authorization: `Bearer ${token}` })
    const next = vi.fn()

    requireAuth(req, mockRes(), next)

    expect(req.user).toEqual({ id: 'user-123', role: 'user' })
    expect(next).toHaveBeenCalledWith()
  })

  it('calls next with error for missing header', () => {
    const req = mockReq()
    const next = vi.fn()

    requireAuth(req, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })

  it('calls next with error for malformed header', () => {
    const req = mockReq({ authorization: 'NotBearer token' })
    const next = vi.fn()

    requireAuth(req, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })

  it('calls next with error for invalid token', () => {
    const req = mockReq({ authorization: 'Bearer invalid.token.here' })
    const next = vi.fn()

    requireAuth(req, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })
})
