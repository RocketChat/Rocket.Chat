import type { LicenseDiagnostics, LicenseDiagnosticsCandidate } from '@rocket.chat/core-typings';

export type DiagnosticsCloud = { registered: boolean; workspaceId: string | null; restrictionDays: number };

type DiagnosticsSummaryInput = {
	diagnostics: LicenseDiagnostics;
	siteUrl: string;
	overwrittenByEnv: boolean;
	cloud?: DiagnosticsCloud;
	version: string;
	now: Date;
};

const statusLabels: Record<LicenseDiagnostics['status'], string> = {
	valid: 'valid',
	invalid: 'not valid',
	none: 'no license',
};

const yesNo = (value: boolean) => (value ? 'yes' : 'no');

const formatDate = (date?: string) => date?.slice(0, 10) ?? '...';

const listOrNone = (items: string[], separator: string) => items.join(separator) || 'none';

const describeCandidate = (candidate: LicenseDiagnosticsCandidate): string[] => {
	const head = `License …${candidate.tokenTail} [${candidate.sources.join(', ')}] ${candidate.loaded ? 'loaded' : 'not loaded'}`;

	if (!candidate.decoded) {
		return [`${head} · cannot be decoded`];
	}

	return [
		`${head} · ${candidate.valid ? 'valid' : 'not valid'}`,
		`  Periods: ${listOrNone(
			candidate.validPeriods.map(
				({ validFrom, validUntil, invalidBehavior, inRange }) =>
					`${formatDate(validFrom)} to ${formatDate(validUntil)} (${invalidBehavior}) ${inRange ? 'in range' : 'out of range'}`,
			),
			'; ',
		)}`,
		`  URLs: ${listOrNone(
			candidate.serverUrls.map(({ type, matches }) => `${type} ${matches ? 'match' : 'mismatch'}`),
			', ',
		)}`,
		`  Reasons: ${listOrNone(
			candidate.behaviors.map(({ behavior, reason }) => `${behavior}/${reason}`),
			', ',
		)}`,
	];
};

const getLeadReasons = ({ diagnosed, candidates }: LicenseDiagnostics): string[] => {
	const lead = diagnosed ? candidates.find(({ sources }) => sources.includes(diagnosed)) : undefined;
	if (!lead?.decoded) {
		return [];
	}

	const reasons = lead.behaviors
		.filter(({ behavior }) => behavior === 'invalidate_license' || behavior === 'prevent_installation')
		.map(({ reason }) => reason);

	return [...new Set(reasons)];
};

export const buildDiagnosticsSummary = ({
	diagnostics,
	siteUrl,
	overwrittenByEnv,
	cloud,
	version,
	now,
}: DiagnosticsSummaryInput): string => {
	const reasons = getLeadReasons(diagnostics);
	const status = `${statusLabels[diagnostics.status]}${reasons.length ? ` (${reasons.join(', ')})` : ''}`;

	return [
		`Rocket.Chat license diagnostics · ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC`,
		`Server version: ${version}`,
		`Status: ${status} · re-apply needed: ${yesNo(diagnostics.needsReapply)} · pending: ${yesNo(diagnostics.pending)}`,
		...(diagnostics.ready ? [] : ['Workspace URL not known yet: licenses cannot be validated']),
		`Site URL: ${siteUrl}`,
		`Normalized URL: ${diagnostics.workspace.normalizedUrl ?? 'unknown'}`,
		`URL hash: ${diagnostics.workspace.urlHash ?? 'unknown'}`,
		`Setting overwritten by environment variable: ${yesNo(overwrittenByEnv)}`,
		...diagnostics.candidates.flatMap(describeCandidate),
		...(cloud
			? [
					`Cloud: registered ${yesNo(cloud.registered)} · workspace id ${cloud.workspaceId ?? 'none'} · restriction days ${cloud.restrictionDays}`,
				]
			: []),
	].join('\n');
};
