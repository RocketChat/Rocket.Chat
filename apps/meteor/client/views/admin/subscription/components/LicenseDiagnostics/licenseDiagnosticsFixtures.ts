import type { LicenseDiagnosticsCandidate } from '@rocket.chat/core-typings';

import type { DiagnosticsStateName, LicenseDiagnosticsResult } from './getDiagnosticsState';

type DecodedCandidate = Extract<LicenseDiagnosticsCandidate, { decoded: true }>;

const candidate = (overrides: Partial<DecodedCandidate> = {}): DecodedCandidate => ({
	sources: ['setting'],
	tokenTail: 'TEST0001',
	loaded: true,
	decoded: true,
	valid: true,
	trial: false,
	offline: false,
	createdAt: '2025-09-30T00:00:00.000Z',
	tags: [{ name: 'Enterprise', color: '#5154ec' }],
	validPeriods: [
		{ validFrom: '2025-09-30T00:00:00.000Z', validUntil: '2026-09-30T00:00:00.000Z', invalidBehavior: 'invalidate_license', inRange: true },
	],
	serverUrls: [{ type: 'url', value: 'chat.acme.org', matches: true }],
	behaviors: [],
	...overrides,
});

const invalid = (overrides: Partial<DecodedCandidate>): Partial<LicenseDiagnosticsResult> => ({
	status: 'invalid',
	candidates: [candidate({ loaded: false, valid: false, ...overrides })],
});

const diagnostics = (overrides: Partial<LicenseDiagnosticsResult> = {}): LicenseDiagnosticsResult => ({
	status: 'valid',
	ready: true,
	workspace: { siteUrl: 'https://chat.acme.org/', normalizedUrl: 'chat.acme.org', urlHash: '176523d04c8b' },
	diagnosed: 'setting',
	candidates: [candidate()],
	pending: false,
	needsReapply: false,
	overwrittenByEnv: false,
	summaryText: [
		'Rocket.Chat license diagnostics · 2026-10-30 12:00 UTC',
		'Server version: 8.1.0',
		'Status: valid · re-apply needed: no · pending: no',
		'Site URL: https://chat.acme.org/',
		'Normalized URL: chat.acme.org',
		'URL hash: 176523d04c8b',
		'Setting overwritten by environment variable: no',
		'License …TEST0001 [setting] loaded · valid',
		'  Periods: 2025-09-30 to 2026-09-30 (invalidate_license) in range',
		'  URLs: url match',
		'  Reasons: none',
	].join('\n'),
	...overrides,
});

export const licenseDiagnosticsByState: Record<DiagnosticsStateName, LicenseDiagnosticsResult> = {
	notReady: diagnostics({ ready: false, workspace: { siteUrl: '' }, diagnosed: undefined, candidates: [] }),
	noLicense: diagnostics({ status: 'none', diagnosed: undefined, candidates: [] }),
	needsReapply: diagnostics({ status: 'invalid', needsReapply: true, candidates: [candidate({ loaded: false })] }),
	unreadable: diagnostics({
		status: 'invalid',
		candidates: [{ sources: ['setting'], tokenTail: 'TEST0001', loaded: false, decoded: false }],
	}),
	severalAddresses: diagnostics(
		invalid({
			serverUrls: [
				{ type: 'url', value: 'chat.acme.org', matches: true },
				{ type: 'url', value: 'localhost:3000', matches: false },
			],
			behaviors: [{ behavior: 'invalidate_license', reason: 'url' }],
		}),
	),
	urlMismatch: diagnostics(
		invalid({
			serverUrls: [{ type: 'url', value: 'chat.acme.com', matches: false }],
			behaviors: [{ behavior: 'invalidate_license', reason: 'url' }],
		}),
	),
	outsidePeriod: diagnostics(
		invalid({
			validPeriods: [
				{
					validFrom: '2024-09-30T00:00:00.000Z',
					validUntil: '2025-09-30T00:00:00.000Z',
					invalidBehavior: 'invalidate_license',
					inRange: false,
				},
			],
			behaviors: [{ behavior: 'invalidate_license', reason: 'period' }],
		}),
	),
	overLimits: diagnostics(invalid({ behaviors: [{ behavior: 'invalidate_license', reason: 'limit', limit: 'activeUsers' }] })),
	invalid: diagnostics(invalid({})),
	envLicenseWon: diagnostics({ candidates: [candidate({ sources: ['setting', 'environment'], tokenTail: 'TEST0002' })] }),
	overwriteVariable: diagnostics({ overwrittenByEnv: true }),
	modulesDisabled: diagnostics({
		candidates: [
			candidate({
				behaviors: [{ behavior: 'disable_modules', reason: 'limit', limit: 'monthlyActiveContacts', modules: ['livechat-enterprise'] }],
			}),
		],
	}),
	offline: diagnostics({ candidates: [candidate({ offline: true })] }),
	valid: diagnostics(),
};
