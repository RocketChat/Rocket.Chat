import { LicenseImp } from '.';
import { applyNewestLicense } from './applyLicense';
import { MockedLicenseBuilder, getReadyLicenseManager } from '../__tests__/MockedLicenseBuilder';

const OLDER = new Date('2026-01-01T00:00:00.000Z');
const NEWER = new Date('2026-06-01T00:00:00.000Z');

describe('getDiagnostics', () => {
	it('should report not ready, without candidates, when the workspace cannot validate yet', async () => {
		const licenseManager = new LicenseImp();
		const license = await new MockedLicenseBuilder().sign();

		const result = await licenseManager.getDiagnostics({ candidates: [{ source: 'setting', token: license }] });

		expect(result).toMatchObject({ status: 'invalid', ready: false, candidates: [], needsReapply: false });
	});

	it('should merge the same token from both sources into one loaded, valid candidate', async () => {
		const licenseManager = await getReadyLicenseManager();
		const license = await new MockedLicenseBuilder().withOffline().sign();
		await licenseManager.setLicense(license);

		const result = await licenseManager.getDiagnostics({
			candidates: [
				{ source: 'setting', token: license },
				{ source: 'environment', token: license },
			],
		});

		expect(result).toMatchObject({ status: 'valid', ready: true, diagnosed: 'setting', needsReapply: false });
		expect(result.candidates).toEqual([
			expect.objectContaining({
				sources: ['setting', 'environment'],
				tokenTail: license.slice(-8),
				loaded: true,
				decoded: true,
				valid: true,
				offline: true,
			}),
		]);
	});

	it('should report a token that cannot be decoded as not decoded, with its tail only', async () => {
		const licenseManager = await getReadyLicenseManager();

		const { status, candidates } = await licenseManager.getDiagnostics({
			candidates: [
				{ source: 'setting', token: 'not-a-license' },
				{ source: 'environment', token: 'short' },
			],
		});

		expect(status).toBe('invalid');
		expect(candidates).toEqual([
			{ sources: ['setting'], tokenTail: '-license', loaded: false, decoded: false },
			{ sources: ['environment'], tokenTail: '', loaded: false, decoded: false },
		]);
	});

	it('should report an expired period as out of range and the license as not valid', async () => {
		const licenseManager = await getReadyLicenseManager();
		const license = await new MockedLicenseBuilder().resetValidPeriods().withExpiredDate().sign();

		const { candidates } = await licenseManager.getDiagnostics({ candidates: [{ source: 'setting', token: license }] });

		expect(candidates[0]).toMatchObject({
			valid: false,
			validPeriods: [expect.objectContaining({ invalidBehavior: 'invalidate_license', inRange: false })],
			behaviors: expect.arrayContaining([expect.objectContaining({ behavior: 'invalidate_license', reason: 'period' })]),
		});
	});

	it('should report a match result for each server URL entry', async () => {
		const licenseManager = await getReadyLicenseManager();
		const license = await new MockedLicenseBuilder().withServerUrls({ value: 'chat.acme.com', type: 'url' }).sign();

		const { candidates } = await licenseManager.getDiagnostics({ candidates: [{ source: 'setting', token: license }] });

		expect(candidates[0]).toMatchObject({
			valid: false,
			serverUrls: [
				{ value: 'localhost:3000', type: 'url', matches: true },
				{ value: 'chat.acme.com', type: 'url', matches: false },
			],
		});
	});

	it('should flag a license that passes now but is still marked invalid as needing a re-apply', async () => {
		const licenseManager = await getReadyLicenseManager();
		await licenseManager.setWorkspaceUrl('https://chat.acme.org');
		const license = await new MockedLicenseBuilder().sign();
		await licenseManager.setLicense(license);
		expect(licenseManager.hasValidLicense()).toBe(false);

		await licenseManager.setWorkspaceUrl('http://localhost:3000');
		const result = await licenseManager.getDiagnostics({ candidates: [{ source: 'setting', token: license }] });

		expect(result).toMatchObject({ status: 'invalid', needsReapply: true });
	});

	it('should diagnose the setting candidate when both fail and the environment one was loaded last', async () => {
		const licenseManager = await getReadyLicenseManager();
		const setting = await new MockedLicenseBuilder().withCreatedAt(NEWER).resetValidPeriods().withExpiredDate().sign();
		const environment = await new MockedLicenseBuilder()
			.withCreatedAt(OLDER)
			.withServerUrls({ value: 'chat.acme.com', type: 'url' })
			.sign();
		await applyNewestLicense(licenseManager, setting, environment);

		const result = await licenseManager.getDiagnostics({
			candidates: [
				{ source: 'setting', token: setting },
				{ source: 'environment', token: environment },
			],
		});

		expect(result).toMatchObject({ status: 'invalid', diagnosed: 'setting', needsReapply: false });
		expect(result.candidates).toEqual([
			expect.objectContaining({ sources: ['setting'], loaded: false, valid: false }),
			expect.objectContaining({ sources: ['environment'], loaded: true, valid: false }),
		]);
	});
});
