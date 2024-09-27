import { AirGappedRestriction } from '@rocket.chat/license';

import { applyAirGappedRestrictionsValidation } from '../../../app/license/server/airGappedRestrictionsWrapper';
// import { settings } from '../../../app/settings/server';
import './airGappedRestrictionsWrapper';

// jest.mock('@rocket.chat/license', () => ({
// 	AirGappedRestriction: {
// 		isRestricted: false,
// 	},
// }));

describe('#airGappedRestrictionsWrapper()', () => {
	it('should throw an error when the workspace is restricted', async () => {
		// (settings.get as jest.Mock).mockReturnValue(0);
		jest.spyOn(AirGappedRestriction, 'isRestricted', 'get').mockReturnValue(true);
		await expect(() => applyAirGappedRestrictionsValidation(jest.fn())).rejects.toThrow(new Error('restricted-workspace'));
	});
	it('should NOT throw an error when the workspace is not restricted', async () => {
		// (settings.get as jest.Mock).mockReturnValue(5);
		jest.spyOn(AirGappedRestriction, 'isRestricted', 'get').mockReturnValue(false);
		const spy = jest.fn();
		await expect(() => applyAirGappedRestrictionsValidation(spy)).not.toThrow();
		await applyAirGappedRestrictionsValidation(spy);
		expect(spy).toHaveBeenCalled();
	});
});
