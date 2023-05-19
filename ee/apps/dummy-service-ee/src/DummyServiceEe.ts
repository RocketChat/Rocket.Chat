import type { DummyService } from '@rocket.chat/dummy-service/src/DummyService';
import { DummyServiceImpl } from '@rocket.chat/dummy-service/src/DummyService';

// eslint-disable-next-line @typescript-eslint/naming-convention
interface DummyServiceEe extends DummyService {
	doAnotherThing(): string;
}

export class DummyServiceEeImpl extends DummyServiceImpl implements DummyServiceEe {
	private hasLicense = false;

	constructor() {
		super();

		const methods = (
			this.constructor?.name === 'Object' ? Object.getOwnPropertyNames(this) : Object.getOwnPropertyNames(Object.getPrototypeOf(this))
		).filter((name) => name !== 'constructor');

		methods.forEach((method) => {
			const originalMethod = method in this && (this as any)[method];

			if (typeof originalMethod !== 'function') {
				return;
			}

			(this as any)[method] = async (...args: any[]) => {
				if (!this.hasLicense) {
					if ((DummyServiceImpl.prototype as any)[method]) {
						return (DummyServiceImpl.prototype as any)[method].call(this, ...args);
					}
					throw new Error(`Method ${method} not implemented`);
				}

				return originalMethod.call(this, ...args);
			};
		});
	}

	doAnotherThing() {
		return 'another thing';
	}
}
