import { ServiceClass } from '@rocket.chat/core-services';

import { LocalServiceRegistry, getCallableMethods } from './LocalServiceRegistry';

class Accounts extends ServiceClass {
	protected name = 'accounts';

	async login(params: unknown): Promise<unknown> {
		return { calledWith: params };
	}

	onUserCreated(): void {
		// reached through the event subject, never called
	}

	override async started(): Promise<void> {
		// owned by the broker
	}
}

describe('getCallableMethods', () => {
	it('should list the methods a service answers calls on', () => {
		expect(getCallableMethods(new Accounts())).toEqual(['login']);
	});
});

describe('LocalServiceRegistry', () => {
	it('should resolve a registered method to its instance', async () => {
		const registry = new LocalServiceRegistry();
		registry.add(new Accounts());

		await expect(registry.resolve('accounts.login')?.([{ resume: 'token' }])).resolves.toEqual({ calledWith: { resume: 'token' } });
	});

	it('should not resolve an unregistered service', () => {
		const registry = new LocalServiceRegistry();

		expect(registry.resolve('accounts.login')).toBeUndefined();
	});

	it('should not resolve a method the service does not have', () => {
		const registry = new LocalServiceRegistry();
		registry.add(new Accounts());

		expect(registry.resolve('accounts.logout')).toBeUndefined();
	});

	it('should not resolve an event handler or a lifecycle hook', () => {
		const registry = new LocalServiceRegistry();
		registry.add(new Accounts());

		expect(registry.resolve('accounts.onUserCreated')).toBeUndefined();
		expect(registry.resolve('accounts.started')).toBeUndefined();
	});

	it('should not resolve a name without a method', () => {
		const registry = new LocalServiceRegistry();
		registry.add(new Accounts());

		expect(registry.resolve('accounts')).toBeUndefined();
	});

	it('should stop resolving a removed service', () => {
		const registry = new LocalServiceRegistry();
		const accounts = new Accounts();
		registry.add(accounts);
		registry.remove(accounts);

		expect(registry.resolve('accounts.login')).toBeUndefined();
	});

	it('should keep the newer instance when a replaced one is removed', async () => {
		const registry = new LocalServiceRegistry();
		const replaced = new Accounts();

		registry.add(replaced);
		registry.add(new Accounts());
		registry.remove(replaced);

		await expect(registry.resolve('accounts.login')?.(['still here'])).resolves.toEqual({ calledWith: 'still here' });
	});
});
