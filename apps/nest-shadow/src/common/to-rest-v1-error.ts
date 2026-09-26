import { HttpException, HttpStatus } from '@nestjs/common';
import type { RestV1ErrorBody } from './rest-v1.failure.js';

interface DomainError {
  error?: unknown;
  message?: string;
  details?: unknown;
}

const parseDetails = (details: unknown): unknown => {
  if (typeof details !== 'string') {
    return details;
  }

  try {
    return JSON.parse(details);
  } catch {
    return details;
  }
};

// Domain answers (a Meteor-style error, a plain Error, a string or a 4xx) are
// part of the contract. Anything else is a fault of this process to log.
export const isUnexpectedError = (exception: unknown): boolean => {
  if (exception instanceof HttpException) {
    return exception.getStatus() >= HttpStatus.INTERNAL_SERVER_ERROR;
  }

  if (
    typeof exception === 'string' ||
    typeof (exception as DomainError)?.error === 'string'
  ) {
    return false;
  }

  return !(exception instanceof Error) || exception.constructor !== Error;
};

// Maps anything an endpoint throws to the status and body the real REST v1
// API answers with, so both APIs fail the same way.
export function toRestV1Error(exception: unknown): {
  status: number;
  body: RestV1ErrorBody;
} {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    const body =
      typeof response === 'object' && 'success' in response
        ? (response as RestV1ErrorBody)
        : { success: false as const, error: exception.message };

    return { status: exception.getStatus(), body };
  }

  const domainError = (exception ?? {}) as DomainError;
  const message =
    typeof exception === 'string' ? exception : domainError.message;
  const errorType =
    typeof domainError.error === 'string' ? domainError.error : undefined;

  switch (errorType) {
    case 'error-too-many-requests':
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        body: { success: false, error: message },
      };
    case 'unauthorized':
    case 'error-unauthorized':
      return {
        status: HttpStatus.FORBIDDEN,
        body: { success: false, error: message },
      };
    default:
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          success: false,
          error: message,
          ...(errorType && { errorType }),
          ...(domainError.details !== undefined && {
            details: parseDetails(domainError.details),
          }),
        },
      };
  }
}
