import { ServiceClass } from '@rocket.chat/core-services';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface DummyService {
	doSomething(): string;
}

export class DummyServiceImpl extends ServiceClass implements DummyService {
	protected name = 'dummy-service';

	constructor() {
		super();
	}

	doSomething() {
		return 'something';
	}
}
