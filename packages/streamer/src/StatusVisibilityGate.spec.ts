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

	it('should stay inactive while the status visibility rules are disabled, so the stream forwards presence untouched', async () => {
		settingsGet.mockImplementation(async (id: string) => id !== 'Accounts_StatusVisibility_Admin_Enabled');

		const gate = new StatusVisibilityGate();

		await expect(gate.ensureActive()).resolves.toBe(false);
		expect(getRestrictedUsers).not.toHaveBeenCalled();
	});

	it('should report no restriction once the set is known to be empty, so a feature nobody uses costs no lookup', async () => {
		const gate = new StatusVisibilityGate();

		const sync = gate.syncRestrictedUsers();
		resolveOldestRead();
		await sync;

		expect(gate.isActive()).toBe(false);
		expect(gate.hasRestrictions('anyone')).toBe(false);
	});

	it('should queue and re-run a sync requested while another one is in flight', async () => {
		const gate = new StatusVisibilityGate();

		const first = gate.syncRestrictedUsers();
		expect(getRestrictedUsers).toHaveBeenCalledTimes(1);

		restrictedUsers = ['restricted'];
		const second = gate.syncRestrictedUsers();
		expect(getRestrictedUsers).toHaveBeenCalledTimes(1);

		pendingReads.shift()?.([]);
		await first;
		await settle();

		expect(getRestrictedUsers).toHaveBeenCalledTimes(2);

		resolveOldestRead();
		await second;

		expect(gate.hasRestrictions('restricted')).toBe(true);
		expect(gate.hasRestrictions('allowed')).toBe(false);
	});
});
