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

const settingsOf = (over: Record<string, unknown> = {}) => {
	const values: Record<string, unknown> = {
		VoIP_TeamCollab_SIP_Integration_Normalize_Caller_Numbers: true,
		Exchange_Contacts_Default_Region: 'AR',
		...over,
	};
	settingsGet.mockImplementation((key: string) => values[key]);
};

describe('resolveCallerContact', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		findOneByUserIdAndPhone.mockResolvedValue(null);
		hasModule.mockReturnValue(true);
		settingsOf();
	});

	describe('matching callers by their normalized number', () => {
		it('looks the caller up by the E.164 form of the number the PBX sent', async () => {
			findOneByUserIdAndPhone.mockResolvedValue({ _id: 'c1', displayName: 'Ana' });

			await expect(resolveCallerContact(UID, '011 4321-1000')).resolves.toEqual({ _id: 'c1', displayName: 'Ana' });
			expect(findOneByUserIdAndPhone).toHaveBeenCalledWith(UID, { e164: '+541143211000' }, undefined);
		});

		it('never asks for a number it could not key, which would search the collection for nothing', async () => {
			await expect(resolveCallerContact(UID, 'anonymous')).resolves.toBeUndefined();
			expect(findOneByUserIdAndPhone).not.toHaveBeenCalled();
		});

		it('still resolves an international number when no default region is configured', async () => {
			settingsOf({ Exchange_Contacts_Default_Region: undefined });

			await resolveCallerContact(UID, '+44 20 7946 0958');

			expect(findOneByUserIdAndPhone).toHaveBeenCalledWith(UID, { e164: '+442079460958' }, undefined);
		});
	});

	describe('matching callers by the number as it arrived', () => {
		beforeEach(() => settingsOf({ VoIP_TeamCollab_SIP_Integration_Normalize_Caller_Numbers: false }));

		it('looks the caller up by the number the PBX spelled, not a form of it', async () => {
			findOneByUserIdAndPhone.mockResolvedValue({ _id: 'c1', displayName: 'Ana' });

			await expect(resolveCallerContact(UID, '011 4321-1000')).resolves.toEqual({ _id: 'c1', displayName: 'Ana' });
			expect(findOneByUserIdAndPhone).toHaveBeenCalledWith(UID, { raw: '011 4321-1000' }, undefined);
		});

		it('asks for a caller id no region could have keyed, since matching it no longer depends on one', async () => {
			await resolveCallerContact(UID, 'anonymous');

			expect(findOneByUserIdAndPhone).toHaveBeenCalledWith(UID, { raw: 'anonymous' }, undefined);
		});
	});

	it('reaches Outlook contacts only while the module is licensed', async () => {
		hasModule.mockReturnValue(false);

		await resolveCallerContact(UID, '011 4321-1000');

		expect(findOneByUserIdAndPhone).toHaveBeenCalledWith(UID, { e164: '+541143211000' }, 'local');
	});
});
