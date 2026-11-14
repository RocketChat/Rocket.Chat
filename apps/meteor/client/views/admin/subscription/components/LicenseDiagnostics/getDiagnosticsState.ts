import type { BehaviorWithContext, LicenseCandidateSource, LicenseDiagnosticsCandidate } from '@rocket.chat/core-typings';
import type { OperationResult } from '@rocket.chat/rest-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

export type LicenseDiagnosticsResult = OperationResult<'GET', '/v1/licenses.diagnostics'>;

type DiagnosticsTone = 'danger' | 'warning' | 'info' | 'success';

const diagnosticsStates = {
	notReady: { tone: 'warning', headline: 'License_diagnostics_not_ready', fix: 'License_diagnostics_not_ready_fix' },
	noLicense: { tone: 'danger', headline: 'License_diagnostics_no_license', fix: 'License_diagnostics_no_license_fix' },
	needsReapply: { tone: 'danger', headline: 'License_diagnostics_needs_reapply', fix: 'License_diagnostics_needs_reapply_fix' },
	unreadable: { tone: 'danger', headline: 'License_error_format_invalid', fix: 'License_diagnostics_unreadable_fix' },
	severalAddresses: { tone: 'danger', headline: 'License_diagnostics_several_addresses', fix: 'License_diagnostics_several_addresses_fix' },
	urlMismatch: { tone: 'danger', headline: 'License_error_url_mismatch', fix: 'License_diagnostics_url_mismatch_fix' },
	outsidePeriod: { tone: 'danger', headline: 'License_error_expired', fix: 'License_diagnostics_outside_period_fix' },
	overLimits: { tone: 'danger', headline: 'License_error_limits_exceeded', fix: 'License_diagnostics_over_limits_fix' },
	invalid: { tone: 'danger', headline: 'License_diagnostics_invalid', fix: 'License_diagnostics_invalid_fix' },
	envLicenseWon: { tone: 'warning', headline: 'License_diagnostics_env_license_won', fix: 'License_diagnostics_env_license_won_fix' },
	overwriteVariable: {
		tone: 'warning',
		headline: 'License_diagnostics_overwrite_variable',
		fix: 'License_diagnostics_overwrite_variable_fix',
	},
	modulesDisabled: { tone: 'warning', headline: 'License_diagnostics_modules_disabled', fix: 'License_diagnostics_modules_disabled_fix' },
	offline: { tone: 'info', headline: 'License_diagnostics_offline' },
	valid: { tone: 'success', headline: 'Valid_license' },
} as const satisfies Record<string, { tone: DiagnosticsTone; headline: TranslationKey; fix?: TranslationKey }>;

export type DiagnosticsStateName = keyof typeof diagnosticsStates;

export type DiagnosticsState = { name: DiagnosticsStateName; tone: DiagnosticsTone; headline: TranslationKey; fix?: TranslationKey };

const toState = (name: DiagnosticsStateName): DiagnosticsState => ({ name, ...diagnosticsStates[name] });

const hasReason = (behaviors: BehaviorWithContext[], reason: string) =>
	behaviors.some((behavior) => behavior.reason === reason && ['invalidate_license', 'prevent_installation'].includes(behavior.behavior));

export const getLeadCandidate = ({ diagnosed, candidates }: LicenseDiagnosticsResult): LicenseDiagnosticsCandidate | undefined =>
	candidates.find(({ sources }) => diagnosed && sources.includes(diagnosed)) ?? candidates[0];

const getInvalidState = (lead: Extract<LicenseDiagnosticsCandidate, { decoded: true }>): DiagnosticsStateName => {
	if (hasReason(lead.behaviors, 'url')) {
		const someMatch = lead.serverUrls.some(({ matches }) => matches);
		return lead.serverUrls.length > 1 && someMatch ? 'severalAddresses' : 'urlMismatch';
	}

	if (hasReason(lead.behaviors, 'period')) {
		return 'outsidePeriod';
	}

	if (hasReason(lead.behaviors, 'limit')) {
		return 'overLimits';
	}

	return 'invalid';
};

const getValidState = (
	lead: Extract<LicenseDiagnosticsCandidate, { decoded: true }>,
	{ overwrittenByEnv }: LicenseDiagnosticsResult,
): DiagnosticsStateName => {
	if (lead.loaded && lead.sources.includes('environment')) {
		return 'envLicenseWon';
	}

	if (overwrittenByEnv) {
		return 'overwriteVariable';
	}

	if (lead.behaviors.some(({ behavior }) => behavior === 'disable_modules')) {
		return 'modulesDisabled';
	}

	return lead.offline ? 'offline' : 'valid';
};

export const getDiagnosticsState = (diagnostics: LicenseDiagnosticsResult): DiagnosticsState => {
	if (!diagnostics.ready) {
		return toState('notReady');
	}

	const lead = getLeadCandidate(diagnostics);

	if (diagnostics.status === 'none') {
		return toState('noLicense');
	}

	if (!lead) {
		return toState(diagnostics.status === 'valid' ? 'valid' : 'invalid');
	}

	if (diagnostics.needsReapply) {
		return toState('needsReapply');
	}

	if (!lead.decoded) {
		return toState('unreadable');
	}

	return toState(diagnostics.status === 'valid' ? getValidState(lead, diagnostics) : getInvalidState(lead));
};

export const getLatestValidUntil = (candidate?: LicenseDiagnosticsCandidate): string | undefined => {
	if (!candidate?.decoded) {
		return undefined;
	}

	return candidate.validPeriods
		.map(({ validUntil }) => validUntil)
		.filter((validUntil): validUntil is string => Boolean(validUntil))
		.sort()
		.at(-1);
};

export const sourceLabels: Record<LicenseCandidateSource, TranslationKey> = {
	setting: 'License_diagnostics_source_setting',
	environment: 'License_diagnostics_source_environment',
};

export const shortenHash = (hash: string) => (hash.length > 16 ? `${hash.slice(0, 8)}…${hash.slice(-4)}` : hash);

export const formatServerUrl = ({ type, value }: { type: string; value: string }) => {
	if (type === 'url') {
		return value;
	}

	return `${type} ${type === 'hash' ? shortenHash(value) : value}`;
};
