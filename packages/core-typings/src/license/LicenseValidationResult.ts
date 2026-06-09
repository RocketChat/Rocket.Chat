import type { ILicenseV3 } from './ILicenseV3';
import type { BehaviorWithContext } from './LicenseBehavior';
import type { LicenseModule } from './LicenseModule';

/**
 * Result of validating a license without applying it.
 *
 * Used to preview what would happen if a given license were applied to the current
 * workspace, so the outcome can be shown to an admin before committing to it.
 */
export type LicenseValidationResult = {
	/**
	 * Whether the provided string is a well-formed, signature-valid license that could be decoded.
	 * When `false`, no further details are available.
	 */
	isFormatValid: boolean;
	/**
	 * Whether the license would be accepted by this workspace, i.e. applying it would not
	 * invalidate it nor prevent its installation.
	 */
	isValid: boolean;
	/** The decoded license. Present only when `isFormatValid` is `true`. */
	license?: ILicenseV3;
	/** The workspace URL the license was validated against. */
	workspaceUrl?: string;
	/** The modules that would be enabled if the license were applied. */
	grantedModules: LicenseModule[];
	/**
	 * The validation behaviors triggered while validating the license, describing why it is
	 * (in)valid — e.g. a workspace URL mismatch, an expired period or an exceeded limit.
	 */
	validationErrors: BehaviorWithContext[];
};
