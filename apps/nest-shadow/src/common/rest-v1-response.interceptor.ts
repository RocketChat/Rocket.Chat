import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, map } from 'rxjs';

// Wraps a handler result in the `API.v1.success()` envelope.
@Injectable()
export class RestV1ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<Record<string, unknown>> {
    return next.handle().pipe(
      map((data: Record<string, unknown> | undefined) => ({
        ...data,
        success: true,
      })),
    );
  }
}
