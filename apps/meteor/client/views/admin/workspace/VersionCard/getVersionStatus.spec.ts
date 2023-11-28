import { getVersionStatus } from './getVersionStatus';

describe('if the server version from server and the highest version from cloud are the same', () => {
	describe('the expiration date is in the future', () => {
		it('should return as latest version', () => {
			const status = getVersionStatus('3.0.0', [
				{
					version: '3.0.0',
					expiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
					security: false,
					infoUrl: '',
				},
			]);

			expect(status.label).toBe('latest');
		});
	});

	describe('the expiration date is in the past', () => {
		it('should return as outdated version', () => {
			const status = getVersionStatus('3.0.0', [
				{
					version: '3.0.0',
					expiration: new Date('2020-01-01'),
					security: false,
					infoUrl: '',
				},
			]);

			expect(status.label).toBe('outdated');
		});
	});
});

describe('if the server version is not in the list of supported versions', () => {
	it('should return as outdated version', () => {
		const status = getVersionStatus('2.0.0', [
			{
				version: '3.0.0',
				expiration: new Date(),
				security: false,
				infoUrl: '',
			},
		]);

		expect(status.label).toBe('outdated');
	});
});

describe('if the server version is in the list of supported versions but is not the highest', () => {
	describe('the expiration date is in the future', () => {
		it('should return as available version', () => {
			const status = getVersionStatus('3.0.0', [
				{
					version: '3.0.0',
					expiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
					security: false,
					infoUrl: '',
				},
				{
					version: '4.0.0',
					expiration: new Date(),
					security: false,
					infoUrl: '',
				},
			]);
			expect(status.label).toBe('available_version');
		});
	});
	describe('the expiration date is in the past', () => {
		it('should return as outdated version', () => {
			const status = getVersionStatus('3.0.0', [
				{
					version: '3.0.0',
					expiration: new Date('2020-01-01'),
					security: false,
					infoUrl: '',
				},
				{
					version: '4.0.0',
					expiration: new Date(),
					security: false,
					infoUrl: '',
				},
			]);
			expect(status.label).toBe('outdated');
		});
	});
});

describe('if the server version is not in the list of supported versions but is the highest', () => {
	it('should return as latest version', () => {
		const status = getVersionStatus('4.0.0', [
			{
				version: '2.0.0',
				expiration: new Date(),
				security: false,
				infoUrl: '',
			},
			{
				version: '3.0.0',
				expiration: new Date(),
				security: false,
				infoUrl: '',
			},
		]);

		expect(status.label).toBe('outdated');
	});
});
