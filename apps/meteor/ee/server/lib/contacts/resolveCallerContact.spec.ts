import { resolveCallerContact } from './resolveCallerContact';

const findOneByUserIdAndPhone = jest.fn();
const hasModule = jest.fn();
const settingsGet = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Contacts: { findOneByUserIdAndPhone: (...args: unknown[]) => findOneByUserIdAndPhone(...args) },
}));

jest.mock('@rocket.chat/license', () => ({ License: { hasModule: (...args: unknown[]) => hasModule(...args) } }));

jest.mock('../../../../server/settings', () => ({ settings: { get: (key: string) => settingsGet(key) } }));

const UID = 'uid';

describe('resolveCallerContact', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		findOneByUserIdAndPhone.mockResolvedValue(null);
		hasModule.mockReturnValue(true);
		settingsGet.mockReturnValue('AR');
	});

	it('looks the caller up by the E.164 form of the number the PBX sent', async () => {
		findOneByUserIdAndPhone.mockResolvedValue({ _id: 'c1', displayName: 'Ana' });

		await expect(resolveCallerContact(UID, '011 4321-1000')).resolves.toEqual({ _id: 'c1', displayName: 'Ana' });
		expect(findOneByUserIdAndPhone).toHaveBeenCalledWith(UID, '+541143211000', undefined);
	});

	it('reaches Outlook contacts only while the module is licensed', async () => {
		hasModule.mockReturnValue(false);

		await resolveCallerContact(UID, '011 4321-1000');

		expect(findOneByUserIdAndPhone).toHaveBeenCalledWith(UID, '+541143211000', 'local');
	});

	it('never asks for a number it could not key, which would search in the collection for nothing', async () => {
		await expect(resolveCallerContact(UID, 'anonymous')).resolves.toBeUndefined();
		expect(findOneByUserIdAndPhone).not.toHaveBeenCalled();
	});

	it('still resolves an international number when no default region is configured', async () => {
		settingsGet.mockReturnValue(undefined);

		await resolveCallerContact(UID, '+44 20 7946 0958');

		expect(findOneByUserIdAndPhone).toHaveBeenCalledWith(UID, '+442079460958', undefined);
	});
});
