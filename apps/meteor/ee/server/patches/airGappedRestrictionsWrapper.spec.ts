import { applyAirGappedRestrictionsValidation } from '../../../app/license/server/airGappedRestrictionsWrapper';
import { settings } from '../../../app/settings/server';
import './airGappedRestrictionsWrapper';

jest.mock('../../../app/settings/server', () => ({
	settings: {
		get: jest.fn(),
	},
}));

describe('#airGappedRestrictionsWrapper()', () => {
	it('should throw an error when the workspace is restricted', async () => {
		(settings.get as jest.Mock).mockReturnValue(0);
		await expect(() => applyAirGappedRestrictionsValidation(jest.fn())).rejects.toThrow(new Error('restricted-workspace'));
	});
	it('should NOT throw an error when the workspace is not restricted', async () => {
		(settings.get as jest.Mock).mockReturnValue(5);
		const spy = jest.fn();
		await expect(() => applyAirGappedRestrictionsValidation(spy)).not.toThrow();
		await applyAirGappedRestrictionsValidation(spy);
		expect(spy).toHaveBeenCalled();
	});
});
