import { MeteorError, isMeteorError } from '@rocket.chat/core-services';

export enum AbacErrorCode {
	InvalidAttributeValues = 'error-invalid-attribute-values',
	InvalidAttributeKey = 'error-invalid-attribute-key',
	AttributeNotFound = 'error-attribute-not-found',
	AttributeInUse = 'error-attribute-in-use',
	DuplicateAttributeKey = 'error-duplicate-attribute-key',
	AttributeDefinitionNotFound = 'error-attribute-definition-not-found',
	RoomNotFound = 'error-room-not-found',
	AbacUnsupportedObjectType = 'error-abac-unsupported-object-type',
	AbacUnsupportedOperation = 'error-abac-unsupported-operation',
	OnlyCompliantCanBeAddedToRoom = 'error-only-compliant-users-can-be-added-to-abac-rooms',
	PdpUnavailable = 'error-pdp-unavailable',
	AttributeStoreExternal = 'error-abac-attribute-store-external',
	EntityResolutionFailed = 'error-virtru-entity-resolution-failed',
	NotAuthorizedToModifyRoom = 'error-abac-not-authorized-to-modify-room',
	RequiredAttributesRemoved = 'error-abac-required-attributes-removed',
	RoomAttributesCleared = 'error-abac-room-attributes-cleared',
	NotEnabled = 'error-abac-not-enabled',
	AttributesRequired = 'error-abac-attributes-required',
	InvalidAttributes = 'error-abac-invalid-attributes',
	AttributeNotAssignable = 'error-abac-attribute-not-assignable',
	AttributesNotAllowed = 'error-abac-attributes-not-allowed',
	AttributesPrivateRoomsOnly = 'error-abac-attributes-private-rooms-only',
	AttributesRoomConversion = 'error-abac-attributes-room-conversion',
	AttributesOwnerMustBeCaller = 'error-abac-attributes-owner-must-be-caller',
	FederatedRoomAttributes = 'error-abac-federated-room-attributes',
	DecisionUnavailable = 'error-abac-decision-unavailable',
	DecisionInconclusive = 'error-abac-decision-inconclusive',
	PublicRoomCreationBlocked = 'error-abac-public-room-creation-blocked',
	DiscussionCreationBlocked = 'error-abac-discussion-creation-blocked',
	RoomLocked = 'error-abac-room-locked',
	CreatorNotAdmitted = 'error-abac-creator-not-admitted',
	PreviewTooManyMembers = 'error-abac-preview-too-many-members',
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

export class AbacAttributeStoreExternalError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.AttributeStoreExternal, details);
	}
}

export class AbacEntityResolutionFailedError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.EntityResolutionFailed, details);
	}
}

export class AbacNotAuthorizedToModifyRoomError extends AbacError {
	constructor(details?: unknown) {
		super(AbacErrorCode.NotAuthorizedToModifyRoom, details);
	}
}

export class PdpHealthCheckError extends MeteorError {
	constructor(errorCode: string) {
		super(errorCode, errorCode);
		this.message = errorCode;

		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class AbacContractError extends MeteorError {
	constructor(code: AbacErrorCode, details?: Record<string, unknown>) {
		super(code, code, details);
		this.message = code;

		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export const getPdpHealthErrorCode = (err: unknown): string => {
	if (isMeteorError(err) && err.reason?.startsWith('ABAC_PDP_Health_')) {
		return err.reason;
	}
	return 'ABAC_PDP_Health_Not_OK';
};
