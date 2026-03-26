import { describe, it, expect } from 'vitest'
import { logger, requestLogger } from './logger.js'

describe('logger', () => {
  it('exports a pino logger instance', () => {
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.fatal).toBe('function')
  })

  it('exports a request logger middleware', () => {
    expect(requestLogger).toBeDefined()
    expect(typeof requestLogger).toBe('function')
  })

  it('redacts sensitive fields', () => {
    const child = logger.child({ password: 'secret123', email: 'test@test.com' })
    // Pino redaction works at serialization time — verify the redact paths are configured
    const bindings = child.bindings()
    expect(bindings.password).toBe('[REDACTED]')
    expect(bindings.email).toBe('test@test.com')
  })
})
