import 'reflect-metadata';
import { ValidationPipe, type ValidationError } from '@nestjs/common';
import type { ValidatorOptions } from 'class-validator';
import { RestV1Failure } from './rest-v1.failure.js';

const ACCEPTS_UNKNOWN_PARAMS = Symbol('ACCEPTS_UNKNOWN_PARAMS');

// Marks a DTO whose endpoint has no schema in the real API, so unknown keys
// pass through the shadow as well.
export const AcceptsUnknownParams =
  (): ClassDecorator =>
  (target): void => {
    Reflect.defineMetadata(ACCEPTS_UNKNOWN_PARAMS, true, target);
  };

const collectMessages = (errors: ValidationError[]): string[] =>
  errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...collectMessages(error.children ?? []),
  ]);

class RestV1ValidationPipe extends ValidationPipe {
  protected override validate(
    object: object,
    validatorOptions?: ValidatorOptions,
  ) {
    const acceptsUnknownParams =
      Reflect.getMetadata(ACCEPTS_UNKNOWN_PARAMS, object.constructor) === true;

    return super.validate(
      object,
      acceptsUnknownParams
        ? { ...validatorOptions, whitelist: false, forbidNonWhitelisted: false }
        : validatorOptions,
    );
  }
}

// Rejects what the ajv schemas of the real API reject, in its error envelope.
export const restV1ValidationPipe = new RestV1ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors) =>
    new RestV1Failure(
      collectMessages(errors).join('\n '),
      'error-invalid-params',
    ),
});
