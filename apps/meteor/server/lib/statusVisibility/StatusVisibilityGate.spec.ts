import { StatusVisibilityGate } from './StatusVisibilityGate';

let restrictedUsers: string[] = [];
let pendingReads: ((users: string[]) => void)[] = [];

const getRestrictedUsers = jest.fn(
	() =>
		new Promise<string[]>((resolve) => {
			pendingReads.push(resolve);
		}),
);

jest.mock('@rocket.chat/core-services', () => ({
	Settings: { get: async () => true },
	StatusVisibility: { getRestrictedUsers: () => getRestrictedUsers() },
}));

const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

const resolveOldestRead = () => pendingReads.shift()?.([...restrictedUsers]);

describe('StatusVisibilityGate', () => {
	beforeEach(() => {
		restrictedUsers = [];
		pendingReads = [];
		getRestrictedUsers.mockClear();
	});

	it('should reject a sync requested while another one is in flight', async () => {
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
