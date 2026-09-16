import { StatusVisibilityGate } from './StatusVisibilityGate';

let restrictedUsers: string[] = [];
let pendingReads: ((users: string[]) => void)[] = [];

const getRestrictedUsers = jest.fn(
	() =>
		new Promise<string[]>((resolve) => {
			pendingReads.push(resolve);
		}),
);

const settingsGet = jest.fn(async (_id: string) => true as boolean);

jest.mock('@rocket.chat/core-services', () => ({
	Settings: { get: (id: string) => settingsGet(id) },
	StatusVisibility: { getRestrictedUsers: () => getRestrictedUsers() },
}));

const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

const resolveOldestRead = () => pendingReads.shift()?.([...restrictedUsers]);

describe('StatusVisibilityGate', () => {
	beforeEach(() => {
		restrictedUsers = [];
		pendingReads = [];
		getRestrictedUsers.mockClear();
		settingsGet.mockReset();
		settingsGet.mockResolvedValue(true);
	});

	it('should stay active when the user status setting cannot be read, so presence is not forwarded unredacted', async () => {
		settingsGet.mockImplementation(async (id: string) => {
			if (id === 'Accounts_UserStatus_Enabled') {
				throw new Error('settings unavailable');
			}

			return false;
		});

		const gate = new StatusVisibilityGate();

		const sync = gate.syncRestrictedUsers();

		await settle();
		resolveOldestRead();
		await sync;

		await expect(gate.ensureActive()).resolves.toBe(true);
	});

	it('should queue and re-run a sync requested while another one is in flight', async () => {
		const gate = new StatusVisibilityGate();

		const first = gate.syncRestrictedUsers();
		expect(getRestrictedUsers).toHaveBeenCalledTimes(1);

		restrictedUsers = ['restricted'];
		const second = gate.syncRestrictedUsers();
		expect(getRestrictedUsers).toHaveBeenCalledTimes(1);

		resolveOldestRead();
		await first;
		await settle();

		expect(getRestrictedUsers).toHaveBeenCalledTimes(2);

		resolveOldestRead();
		await second;

		expect(gate.hasRestrictions('restricted')).toBe(true);
		expect(gate.hasRestrictions('allowed')).toBe(false);
	});
});
