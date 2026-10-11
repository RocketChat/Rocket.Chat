// Structural shape covering both Meteor.Error and Meteor.TypedError. The 2FA
// helpers only narrow errors by `error` / `errorType` / `details` — they never
// instanceof — so a local type avoids pulling `meteor/meteor` for type info.
export type MeteorErrorLike = Error & {
	error?: unknown;
	errorType?: unknown;
	reason?: string;
	details?: unknown;
};
