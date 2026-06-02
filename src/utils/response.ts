import { Response } from 'express';

/**
 * Unified API Response Format
 *
 * Success: { traceId, success: true, data: {} }
 * Error:   { traceId, success: false, error: { code, message } }
 */

export interface ApiSuccessResponse<T = unknown> {
  traceId: string;
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  traceId: string;
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Send a standardized success response
 */
export const sendSuccess = <T>(
  res: Response,
  traceId: string,
  data: T,
  statusCode: number = 200
): Response<ApiSuccessResponse<T>> => {
  return res.status(statusCode).json({
    traceId,
    success: true,
    data,
  });
};

/**
 * Send a standardized error response
 */
export const sendError = (
  res: Response,
  traceId: string,
  statusCode: number,
  code: string,
  message: string
): Response<ApiErrorResponse> => {
  return res.status(statusCode).json({
    traceId,
    success: false,
    error: {
      code,
      message,
    },
  });
};
