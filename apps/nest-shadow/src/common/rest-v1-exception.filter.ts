import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { isUnexpectedError, toRestV1Error } from './to-rest-v1-error.js';

@Catch()
export class RestV1ExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RestV1ExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (isUnexpectedError(exception)) {
      this.logger.error(exception);
    }

    const { status, body } = toRestV1Error(exception);
    host.switchToHttp().getResponse<Response>().status(status).json(body);
  }
}
