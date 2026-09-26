import { HttpException, HttpStatus } from '@nestjs/common';

export interface RestV1ErrorBody {
  success: false;
  error?: string;
  errorType?: string;
  details?: unknown;
  status?: 'error';
  message?: string;
}

// The `API.v1.failure()` answer of the real API: HTTP 400 with the error in
// the body.
export class RestV1Failure extends HttpException {
  constructor(error?: string, errorType?: string, details?: unknown) {
    const body: RestV1ErrorBody = {
      success: false,
      ...(error !== undefined && { error }),
      ...(errorType && { errorType }),
      ...(details !== undefined && { details }),
    };

    super(body, HttpStatus.BAD_REQUEST);
  }
}

export class RestV1Forbidden extends HttpException {
  constructor(error = 'unauthorized') {
    super({ success: false, error }, HttpStatus.FORBIDDEN);
  }
}

export class RestV1Unauthorized extends HttpException {
  constructor() {
    const error = 'You must be logged in to do this.';
    super(
      { success: false, error, status: 'error', message: error },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
