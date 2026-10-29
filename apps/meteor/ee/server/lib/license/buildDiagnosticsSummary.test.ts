import { describe, it } from 'node:test';

import { expect } from 'chai';

import { buildDiagnosticsSummary } from './buildDiagnosticsSummary';

describe('buildDiagnosticsSummary', () => {
	it('should list each candidate by token tail and URL match result, without the bound values', () => {
		const text = buildDiagnosticsSummary({
			diagnostics: {
				status: 'invalid',
				ready: true,
				workspace: { normalizedUrl: 'chat.acme.org', urlHash: 'f00d' },
				diagnosed: 'setting',
				candidates: [
					{
						sources: ['setting'],
						tokenTail: 'TEST0001',
						loaded: true,
						decoded: true,
						valid: false,
						trial: false,
						offline: false,
						createdAt: '2025-09-30T00:00:00.000Z',
						tags: [],
						validPeriods: [
							{
								validFrom: '2025-09-30T00:00:00.000Z',
								validUntil: '2026-09-30T00:00:00.000Z',
								invalidBehavior: 'invalidate_license',
								inRange: false,
							},
						],
						serverUrls: [
							{ type: 'url', value: 'chat.acme.com', matches: false },
							{ type: 'hash', value: 'beef', matches: false },
						],
						behaviors: [
							{ behavior: 'invalidate_license', reason: 'url' },
							{ behavior: 'invalidate_license', reason: 'period' },
						],
					},
					{ sources: ['environment'], tokenTail: 'TEST0002', loaded: false, decoded: false },
				],
				pending: false,
				needsReapply: false,
			},
			siteUrl: 'https://chat.acme.org/',
			overwrittenByEnv: false,
			cloud: { registered: false, workspaceId: null, restrictionDays: -1 },
			version: '8.1.0',
			now: new Date('2026-10-29T18:40:00.000Z'),
		});

		expect(text).to.equal(
			[
				'Rocket.Chat license diagnostics · 2026-10-29 18:40 UTC',
				'Server version: 8.1.0',
				'Status: not valid (url, period) · re-apply needed: no · pending: no',
				'Site URL: https://chat.acme.org/',
				'Normalized URL: chat.acme.org',
				'URL hash: f00d',
				'Setting overwritten by environment variable: no',
				'License …TEST0001 [setting] loaded · not valid',
				'  Periods: 2025-09-30 to 2026-09-30 (invalidate_license) out of range',
				'  URLs: url mismatch, hash mismatch',
				'  Reasons: invalidate_license/url, invalidate_license/period',
				'License …TEST0002 [environment] not loaded · cannot be decoded',
				'Cloud: registered no · workspace id none · restriction days -1',
			].join('\n'),
		);
		expect(text).to.not.include('chat.acme.com');
		expect(text).to.not.include('beef');
	});
});
