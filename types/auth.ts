import { z } from 'zod';

export const BaseRespSchema = z.object({
  StatusMessage: z.string(),
  StatusCode: z.number()
});

export const AuthResponseSchema = z.object({
  status: z.literal('NeedAuth'),
  authenticationUrl: z.string().url(),
  userAccessToken: z.string(),
  BaseResp: BaseRespSchema
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type BaseResp = z.infer<typeof BaseRespSchema>; 