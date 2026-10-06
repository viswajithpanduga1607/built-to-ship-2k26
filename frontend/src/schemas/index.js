import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST SUBMISSION SCHEMA
// Used by: RequestForm (frontend) and n8n webhook payload validator (backend)
// ─────────────────────────────────────────────────────────────────────────────

export const REQUEST_TYPES  = /** @type {const} */ (['PTO', 'Sick Leave', 'Remote Work', 'Equipment'])
export const URGENCY_LEVELS = /** @type {const} */ (['Low', 'Medium', 'High'])

export const requestInputSchema = z
  .object({
    requestType: z.enum(REQUEST_TYPES, {
      errorMap: () => ({ message: 'Please select a valid request type' }),
    }),

    startDate: z
      .string()
      .min(1, 'Start date is required')
      .refine(d => !isNaN(new Date(d).getTime()), 'Invalid start date'),

    endDate: z
      .string()
      .min(1, 'End date is required')
      .refine(d => !isNaN(new Date(d).getTime()), 'Invalid end date'),

    justification: z
      .string()
      .min(10, 'Please provide a more detailed justification (at least 10 characters)')
      .max(1000, 'Justification must be under 1000 characters'),

    urgency: z.enum(URGENCY_LEVELS, {
      errorMap: () => ({ message: 'Please select an urgency level' }),
    }),
  })
  .refine(
    data => new Date(data.startDate) <= new Date(data.endDate),
    {
      message: 'End date cannot be before start date',
      path:    ['endDate'],
    }
  )
  .refine(
    data => new Date(data.startDate) >= new Date(new Date().toDateString()),
    {
      message: 'Start date cannot be in the past',
      path:    ['startDate'],
    }
  )

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name is too long'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  })

// ─────────────────────────────────────────────────────────────────────────────
// AI EVALUATION RESPONSE SCHEMA (mirrors Gemini JSON output)
// ─────────────────────────────────────────────────────────────────────────────

export const aiEvaluationSchema = z.object({
  decision:              z.enum(['Approved', 'Requires Manual Review']),
  reasoning:             z.string(),
  calendarEventRequired: z.boolean(),
  sentimentAnalysis:     z.string(),
})

/** @typedef {z.infer<typeof requestInputSchema>}  RequestInput */
/** @typedef {z.infer<typeof loginSchema>}          LoginInput */
/** @typedef {z.infer<typeof registerSchema>}       RegisterInput */
/** @typedef {z.infer<typeof aiEvaluationSchema>}   AiEvaluation */
