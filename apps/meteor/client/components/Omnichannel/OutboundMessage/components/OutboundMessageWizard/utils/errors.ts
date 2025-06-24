import type { FieldErrors, FieldValues } from 'react-hook-form';

export class FormValidationError<FormData extends FieldValues = FieldValues> extends Error {
	constructor(message: string, { cause }: { cause?: FieldErrors<FormData> }) {
		super(message, { cause });
	}
}

export class FormFetchError extends Error {
	constructor(message: string) {
		super(message);
	}
}
