import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { MeteorError } from '@rocket.chat/core-services';
import { RestV1Failure, RestV1Unauthorized } from './rest-v1.failure.js';
import { isUnexpectedError, toRestV1Error } from './to-rest-v1-error.js';

describe('toRestV1Error', () => {
  it('answers a domain error with 400, its message and its type', () => {
    const error = new MeteorError('error-not-allowed', 'Not allowed', {
      method: 'getSingleMessage',
    });

    expect(toRestV1Error(error)).toEqual({
      status: 400,
      body: {
        success: false,
        error: 'Not allowed [error-not-allowed]',
        errorType: 'error-not-allowed',
        details: { method: 'getSingleMessage' },
      },
    });
  });

  it('answers a plain error with 400 and its message only', () => {
    expect(toRestV1Error(new Error('error-invalid-room'))).toEqual({
      status: 400,
      body: { success: false, error: 'error-invalid-room' },
    });
  });

  it('answers an unauthorized domain error with 403', () => {
    const error = new MeteorError('error-unauthorized', 'No username');

    expect(toRestV1Error(error).status).toBe(403);
  });

  it('keeps the body of a REST v1 failure', () => {
    expect(
      toRestV1Error(new RestV1Failure('not-allowed', 'Not Allowed')),
    ).toEqual({
      status: 400,
      body: { success: false, error: 'not-allowed', errorType: 'Not Allowed' },
    });
    expect(toRestV1Error(new RestV1Unauthorized()).status).toBe(401);
  });

  it('wraps other HTTP exceptions in the failure envelope', () => {
    expect(toRestV1Error(new NotFoundException('Cannot GET /x'))).toEqual({
      status: 404,
      body: { success: false, error: 'Cannot GET /x' },
    });
  });
});

describe('isUnexpectedError', () => {
  it('treats domain answers as expected', () => {
    expect(isUnexpectedError(new Error('error-invalid-room'))).toBe(false);
    expect(isUnexpectedError(new MeteorError('error-not-allowed'))).toBe(false);
    expect(isUnexpectedError(new RestV1Failure('nope'))).toBe(false);
  });

  it('treats faults of the process as unexpected', () => {
    expect(isUnexpectedError(new TypeError('x is undefined'))).toBe(true);
    expect(isUnexpectedError(new ServiceUnavailableException())).toBe(true);
  });
});
