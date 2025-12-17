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
}

export class AbacError extends Error {
	public readonly code: AbacErrorCode;

	public readonly details?: unknown;

	constructor(code: AbacErrorCode, details?: unknown) {
		super(code);
		this.code = code;
		this.details = details;

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
