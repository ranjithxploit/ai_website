import { z } from 'zod';

/**
 * User Registration Validation
 */
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    name: z
      .string({
        required_error: 'Name is required',
      })
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters')
      .trim(),
  }),
});

/**
 * User Login Validation
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
    password: z.string({
      required_error: 'Password is required',
    }),
  }),
});

/**
 * Refresh Token Validation
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({
      required_error: 'Refresh token is required',
    }),
  }),
});

/**
 * Template Upload Validation
 */
export const uploadTemplateSchema = z.object({
  body: z.object({
    originalName: z.string().optional(),
  }),
});

/**
 * Document Generation Validation
 */
export const generateDocumentSchema = z.object({
  body: z.object({
    templateId: z
      .string({
        required_error: 'Template ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid template ID'),
    topics: z
      .array(
        z.object({
          name: z
            .string()
            .min(1, 'Topic name is required')
            .max(200, 'Topic name cannot exceed 200 characters')
            .trim(),
          style: z.enum(['bullets', 'bullets-paragraph', 'paragraph'], {
            errorMap: () => ({ message: 'Invalid style format' }),
          }),
        })
      )
      .min(1, 'At least one topic is required')
      .max(10, 'Cannot exceed 10 topics'),
    requestedPages: z
      .number({
        required_error: 'Requested pages is required',
      })
      .int('Pages must be an integer')
      .min(1, 'Must request at least 1 page')
      .max(50, 'Cannot request more than 50 pages'),
  }),
});

/**
 * Document ID Validation
 */
export const documentIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid document ID'),
  }),
});

/**
 * Template ID Validation
 */
export const templateIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid template ID'),
  }),
});

/**
 * Download Format Validation
 */
export const downloadFormatSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid document ID'),
    format: z.enum(['docx', 'pdf'], {
      errorMap: () => ({ message: 'Format must be docx or pdf' }),
    }),
  }),
});

/**
 * Pagination Validation
 */
export const paginationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().int().min(1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .pipe(z.number().int().min(1).max(100)),
  }),
});

// Type exports for use in controllers
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type GenerateDocumentInput = z.infer<typeof generateDocumentSchema>['body'];
