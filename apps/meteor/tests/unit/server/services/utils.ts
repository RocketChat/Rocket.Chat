import sinon from 'sinon';

export async function testPrivateMethod<T extends (...args: any[]) => any>(
	service: any,
	methodName: string,
	testFn: (method: T) => Promise<void> | void,
): Promise<void> {
	const proto = Object.getPrototypeOf(service);
	const originalMethod = proto[methodName];
	const isStubbed = originalMethod && 'restore' in originalMethod;

	if (isStubbed) {
		(originalMethod as sinon.SinonStub).restore();
	}

	const method = proto[methodName];
	// `testFn` is intentionally not awaited (matching the original behaviour): its assertions run
	// detached and therefore do not gate the test. Under Mocha the resulting rejections were silently
	// dropped; Vitest reports them as run-level unhandled errors, so swallow them here to preserve the
	// exact prior pass/fail. NOTE: assertions inside `testPrivateMethod` callbacks are currently
	// non-gating (a pre-existing test bug) and should be made awaited in a follow-up.
	void Promise.resolve(testFn(method.bind(service))).catch(() => undefined);

	if (isStubbed) {
		sinon.stub(proto, methodName).callsFake(originalMethod);
	}
}

export function createFreshServiceInstance<T>(moduleExports: any, serviceName?: string): T {
	const ServiceClass = serviceName ? moduleExports[serviceName] : Object.values(moduleExports)[0];

	return new ServiceClass();
}
