export class MatrixError<TCode extends string> extends Error {
	public readonly status: number = 400;

	public constructor(
		public readonly errcode: TCode,
		message: string,
	) {
		super(message);
	}

	public toJSON() {
		return {
			errcode: this.errcode,
			error: this.message,
		};
	}
}

// Common errors

/** Forbidden access, e.g. joining a room without permission, failed login. */
export class ForbiddenError extends MatrixError<'M_FORBIDDEN'> {
	public readonly status = 403;

	public constructor(message: string) {
		super('M_FORBIDDEN', message);
	}
}

/** The access or refresh token specified was not recognised. */
export class UnknownTokenError extends MatrixError<'M_UNKNOWN_TOKEN'> {
	public readonly status = 401;

	public softLogout?: boolean;

	public constructor(
		message: string,
		{ softLogout }: { softLogout?: boolean } = {},
	) {
		super('M_UNKNOWN_TOKEN', message);
		this.softLogout = softLogout;
	}

	public toJSON() {
		return {
			...super.toJSON(),
			...(this.softLogout !== undefined && { soft_logout: this.softLogout }),
		};
	}
}

/** No access token was specified for the request. */
export class MissingTokenError extends MatrixError<'M_MISSING_TOKEN'> {
	public constructor(message: string) {
		super('M_MISSING_TOKEN', message);
	}
}

/** The account has been locked and cannot be used at this time. */
export class UserLockedError extends MatrixError<'M_USER_LOCKED'> {
	public constructor(message: string) {
		super('M_USER_LOCKED', message);
	}
}

/** Request contained valid JSON, but it was malformed in some way, e.g. missing required keys, invalid values for keys. */
export class BadJSONError extends MatrixError<'M_BAD_JSON'> {
	public constructor(message: string) {
		super('M_BAD_JSON', message);
	}
}

/** Request did not contain valid JSON. */
export class NotJSONError extends MatrixError<'M_NOT_JSON'> {
	public constructor(message: string) {
		super('M_NOT_JSON', message);
	}
}

/** No resource was found for this request. */
export class NotFoundError extends MatrixError<'M_NOT_FOUND'> {
	public constructor(message: string) {
		super('M_NOT_FOUND', message);
	}
}

/** Too many requests have been sent in a short period of time. Wait a while then try again. */
export class LimitExceededError extends MatrixError<'M_LIMIT_EXCEEDED'> {
	public constructor(message: string) {
		super('M_LIMIT_EXCEEDED', message);
	}
}

/**
 * The server did not understand the request.
 *
 * This is expected to be returned with a 404 HTTP status code if the endpoint is not implemented or a 405 HTTP status code if the endpoint is implemented, but the incorrect HTTP method is used.
 */
export class UnrecognizedError extends MatrixError<'M_UNRECOGNIZED'> {
	private constructor(
		message: string,
		public readonly status: number,
	) {
		super('M_UNRECOGNIZED', message);
	}

	public static notImplemented(message: string) {
		return new UnrecognizedError(message, 404);
	}

	public static methodNotAllowed(message: string) {
		return new UnrecognizedError(message, 405);
	}
}

/** An unknown error has occurred. */
export class UnknownError extends MatrixError<'M_UNKNOWN'> {
	public constructor(message: string) {
		super('M_UNKNOWN', message);
	}
}

// Other errors

/** The request was not correctly authorized. Usually due to login failures. */
export class UnauthorizedError extends MatrixError<'M_UNAUTHORIZED'> {
	public constructor(message: string) {
		super('M_UNAUTHORIZED', message);
	}
}

/**
 * The user ID associated with the request has been deactivated.
 *
 * Typically for endpoints that prove authentication, such as /login.
 */
export class UserDeactivatedError extends MatrixError<'M_USER_DEACTIVATED'> {
	public constructor(message: string) {
		super('M_USER_DEACTIVATED', message);
	}
}

/** Encountered when trying to register a user ID which has been taken. */
export class UserInUseError extends MatrixError<'M_USER_IN_USE'> {
	public constructor(message: string) {
		super('M_USER_IN_USE', message);
	}
}

/** Encountered when trying to register a user ID which is not valid. */
export class InvalidUsernameError extends MatrixError<'M_INVALID_USERNAME'> {
	public constructor(message: string) {
		super('M_INVALID_USERNAME', message);
	}
}

/** Sent when the room alias given to the createRoom API is already in use. */
export class RoomInUseError extends MatrixError<'M_ROOM_IN_USE'> {
	public constructor(message: string) {
		super('M_ROOM_IN_USE', message);
	}
}

/** Sent when the initial state given to the createRoom API is invalid. */
export class InvalidRoomStateError extends MatrixError<'M_INVALID_ROOM_STATE'> {
	public constructor(message: string) {
		super('M_INVALID_ROOM_STATE', message);
	}
}

/** Sent when a threepid given to an API cannot be used because the same threepid is already in use. */
export class ThreePidInUseError extends MatrixError<'M_THREEPID_IN_USE'> {
	public constructor(message: string) {
		super('M_THREEPID_IN_USE', message);
	}
}

/** Sent when a threepid given to an API cannot be used because no record matching the threepid was found. */
export class ThreePidNotFoundError extends MatrixError<'M_THREEPID_NOT_FOUND'> {
	public constructor(message: string) {
		super('M_THREEPID_NOT_FOUND', message);
	}
}

/** Authentication could not be performed on the third-party identifier. */
export class ThreePidAuthFailedError extends MatrixError<'M_THREEPID_AUTH_FAILED'> {
	public constructor(message: string) {
		super('M_THREEPID_AUTH_FAILED', message);
	}
}

/**
 * The server does not permit this third-party identifier.
 *
 * This may happen if the server only permits, for example, email addresses from a particular domain.
 */
export class ThreePidDeniedError extends MatrixError<'M_THREEPID_DENIED'> {
	public constructor(message: string) {
		super('M_THREEPID_DENIED', message);
	}
}

/** The client’s request used a third-party server, e.g. identity server, that this server does not trust. */
export class ServerNotTrustedError extends MatrixError<'M_SERVER_NOT_TRUSTED'> {
	public constructor(message: string) {
		super('M_SERVER_NOT_TRUSTED', message);
	}
}

/** The client’s request to create a room used a room version that the server does not support. */
export class UnsupportedRoomVersionError extends MatrixError<'M_UNSUPPORTED_ROOM_VERSION'> {
	public constructor(message: string) {
		super('M_UNSUPPORTED_ROOM_VERSION', message);
	}
}

/**
 * The client attempted to join a room that has a version the server does not support.
 *
 * Inspect the room_version property of the error response for the room’s version.
 */
export class IncompatibleRoomVersionError extends MatrixError<'M_INCOMPATIBLE_ROOM_VERSION'> {
	public roomVersion: string;

	public constructor(
		message: string,
		{ roomVersion }: { roomVersion: string },
	) {
		super('M_INCOMPATIBLE_ROOM_VERSION', message);
		this.roomVersion = roomVersion;
	}

	public toJSON() {
		return {
			...super.toJSON(),
			room_version: this.roomVersion,
		};
	}
}

/** The state change requested cannot be performed, such as attempting to unban a user who is not banned. */
export class BadStateError extends MatrixError<'M_BAD_STATE'> {
	public constructor(message: string) {
		super('M_BAD_STATE', message);
	}
}

/** The room or resource does not permit guests to access it. */
export class GuestAccessForbiddenError extends MatrixError<'M_GUEST_ACCESS_FORBIDDEN'> {
	public constructor(message: string) {
		super('M_GUEST_ACCESS_FORBIDDEN', message);
	}
}

/** A Captcha is required to complete the request. */
export class CaptchaNeededError extends MatrixError<'M_CAPTCHA_NEEDED'> {
	public constructor(message: string) {
		super('M_CAPTCHA_NEEDED', message);
	}
}

/** The Captcha provided did not match what was expected. */
export class CaptchaInvalidError extends MatrixError<'M_CAPTCHA_INVALID'> {
	public constructor(message: string) {
		super('M_CAPTCHA_INVALID', message);
	}
}

/** A required parameter was missing from the request. */
export class MissingParamError extends MatrixError<'M_MISSING_PARAM'> {
	public constructor(message: string) {
		super('M_MISSING_PARAM', message);
	}
}

/**
 * A parameter that was specified has the wrong value.
 *
 * For example, the server expected an integer and instead received a string.
 */
export class InvalidParamError extends MatrixError<'M_INVALID_PARAM'> {
	public constructor(message: string) {
		super('M_INVALID_PARAM', message);
	}
}

/** The request or entity was too large. */
export class TooLargeError extends MatrixError<'M_TOO_LARGE'> {
	public constructor(message: string) {
		super('M_TOO_LARGE', message);
	}
}

/** The resource being requested is reserved by an application service, or the application service making the request has not created the resource. */
export class ExclusiveError extends MatrixError<'M_EXCLUSIVE'> {
	public constructor(message: string) {
		super('M_EXCLUSIVE', message);
	}
}

/**
 * The request cannot be completed because the homeserver has reached a resource limit imposed on it.
 *
 * For example, a homeserver held in a shared hosting environment may reach a resource limit if it starts using too much memory or disk space.
 *
 * The error MUST have an admin_contact field to provide the user receiving the error a place to reach out to.
 *
 * Typically, this error will appear on routes which attempt to modify state (e.g.: sending messages, account data, etc) and not routes which only read state (e.g.: /sync, get account data, etc).
 */
export class ResourceLimitExceededError extends MatrixError<'M_RESOURCE_LIMIT_EXCEEDED'> {
	public constructor(
		message: string,
		public readonly adminContact: string,
	) {
		super('M_RESOURCE_LIMIT_EXCEEDED', message);
	}

	public toJSON() {
		return {
			...super.toJSON(),
			admin_contact: this.adminContact,
		};
	}
}

/** The user is unable to reject an invite to join the server notices room. */
export class CannotRejectServerNoticeRoomError extends MatrixError<'M_CANNOT_REJECT_SERVER_NOTICE_ROOM'> {
	public constructor(message: string) {
		super('M_CANNOT_REJECT_SERVER_NOTICE_ROOM', message);
	}
}
