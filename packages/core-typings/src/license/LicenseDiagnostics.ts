import type { ILicenseTag } from './ILicenseTag';
import type { ILicenseV3 } from './ILicenseV3';
import type { BehaviorWithContext, LicenseBehavior } from './LicenseBehavior';

export type LicenseCandidateSource = 'setting' | 'environment';

export type LicenseDiagnosticsCandidate = {
	sources: LicenseCandidateSource[];
	tokenTail: string;
	loaded: boolean;
} & (
	| { decoded: false }
	| {
			decoded: true;
			valid: boolean;
			trial: boolean;
			offline: boolean;
			createdAt: string;
			tags: ILicenseTag[];
			validPeriods: { validFrom?: string; validUntil?: string; invalidBehavior: LicenseBehavior; inRange: boolean }[];
			serverUrls: (ILicenseV3['validation']['serverUrls'][number] & { matches: boolean })[];
			behaviors: BehaviorWithContext[];
	  }
);

export type LicenseDiagnostics = {
	status: 'valid' | 'invalid' | 'none';
	ready: boolean;
	workspace: { normalizedUrl?: string; urlHash?: string };
	diagnosed?: LicenseCandidateSource;
	candidates: LicenseDiagnosticsCandidate[];
	pending: boolean;
	needsReapply: boolean;
};
