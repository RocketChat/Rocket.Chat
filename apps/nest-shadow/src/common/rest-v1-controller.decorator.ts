import {
  Controller,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
  applyDecorators,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { RestV1ExceptionFilter } from './rest-v1-exception.filter.js';
import { RestV1ResponseInterceptor } from './rest-v1-response.interceptor.js';
import { restV1ValidationPipe } from './rest-v1-validation.pipe.js';

// Marks a controller as part of the REST v1 shadow: authenticated routes under
// /api/v1 that answer with the success and failure envelopes of the real API.
export const RestV1Controller = () =>
  applyDecorators(
    Controller({ version: '1' }),
    UseGuards(AuthGuard),
    UsePipes(restV1ValidationPipe),
    UseInterceptors(RestV1ResponseInterceptor),
    UseFilters(RestV1ExceptionFilter),
  );
