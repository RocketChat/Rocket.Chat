import { MeteorError, isMeteorError } from '@rocket.chat/core-services';

export enum AbacErrorCode {
	InvalidAttributeValues = 'error-invalid-attribute-values',
	InvalidAttributeKey = 'error-invalid-attribute-key',
	AttributeNotFound = 'error-attribute-not-found',
	AttributeInUse = 'error-attribute-in-use',
	DuplicateAttributeKey = 'error-duplicate-attribute-key',
	AttributeDefinitionNotFound = 'error-attribute-definition-not-found',
	RoomNotFound = 'error-room-not-found',
	CannotConvertDefaultRoomToAbac = 'error-cannot-convert-default-room-to-abac',
	AbacUnsupportedObjectType = 'error-abac-unsupported-object-type',
	AbacUnsupportedOperation = 'error-abac-unsupported-operation',
	OnlyCompliantCanBeAddedToRoom = 'error-only-compliant-users-can-be-added-to-abac-rooms',
	PdpUnavailable = 'error-pdp-unavailable',
}

export class AbacError extends MeteorError {
	public readonly code: AbacErrorCode;

	constructor(code: AbacErrorCode, details?: unknown) {
		super(code, undefined, details);
		this.code = code;
		// MeteorError formats `.message` as `[code]`, and wrappers (addUserToRoom, Meteor.Error, ...) keep
		// stacking brackets onto the previous message. Flatten it here so the code does not accumulate.
		this.message = code;

		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class AbacInvalidAttributeValuesError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.InvalidAttributeValues, details);
	}
}

export class AbacInvalidAttributeKeyError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.InvalidAttributeKey, details);
	}
}

export class AbacAttributeNotFoundError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.AttributeNotFound, details);
	}
}

export class AbacAttributeInUseError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.AttributeInUse, details);
	}
}

export class AbacDuplicateAttributeKeyError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.DuplicateAttributeKey, details);
	}
}

export class AbacAttributeDefinitionNotFoundError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.AttributeDefinitionNotFound, details);
	}
}

export class AbacRoomNotFoundError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.RoomNotFound, details);
	}
}

export class AbacCannotConvertDefaultRoomToAbacError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.CannotConvertDefaultRoomToAbac, details);
	}
}

export class AbacUnsupportedObjectTypeError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.AbacUnsupportedObjectType, details);
	}
}

export class AbacUnsupportedOperationError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.AbacUnsupportedOperation, details);
	}
}

export class OnlyCompliantCanBeAddedToRoomError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.OnlyCompliantCanBeAddedToRoom, details);
	}
}

export class PdpUnavailableError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.PdpUnavailable, details);
	}
}

export class PdpHealthCheckError extends MeteorError {
	constructor(errorCode: string) {
		// `reason` is the field the CustomRegenerator preserves across the broker, so the API layer
		// can read the code via `err.reason` in microservices mode (see getPdpHealthErrorCode).
		super(errorCode, errorCode);
		this.message = errorCode;

		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export const getPdpHealthErrorCode = (err: unknown): string | null => {
	if (!isMeteorError(err) || !err.reason?.startsWith('ABAC_PDP_Health_')) {
		return null;
	}
	return err.reason;
};
