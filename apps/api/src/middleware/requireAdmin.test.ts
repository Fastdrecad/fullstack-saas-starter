import { describe, it, expect, vi } from 'vitest'
import { type Request, type Response } from 'express'
import { requireAdmin } from './requireAdmin.js'

const mockReq = (role: string) => ({ user: { id: 'user-123', role } }) as unknown as Request

const mockRes = () => ({}) as Response

describe('requireAdmin', () => {
  it('calls next for admin role', () => {
    const req = mockReq('admin')
    const next = vi.fn()

    requireAdmin(req, mockRes(), next)

    expect(next).toHaveBeenCalledWith()
  })

  it('calls next with 403 error for user role', () => {
    const req = mockReq('user')
    const next = vi.fn()

    requireAdmin(req, mockRes(), next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403, code: 'FORBIDDEN' }),
    )
  })
})
