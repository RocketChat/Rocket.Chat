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
	void testFn(method.bind(service));

	if (isStubbed) {
		sinon.stub(proto, methodName).callsFake(originalMethod);
	}
}

export function createFreshServiceInstance<T>(moduleExports: any, serviceName?: string): T {
	const ServiceClass = serviceName ? moduleExports[serviceName] : Object.values(moduleExports)[0];

	return new ServiceClass();
}
