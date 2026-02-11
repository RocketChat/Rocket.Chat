class ServiceSet extends Set<string> {
	includes(service: string): boolean {
		return this.has(service);
	}

	override add(service: string): this {
		if (this.has(service)) {
			throw new Error(`Duplicate service: ${service}`);
		}

		return super.add(service);
	}

	override delete(service: string): boolean {
		if (!this.has(service)) {
			throw new Error(`Service not found: ${service}`);
		}

		return super.delete(service);
	}
}

const services = new ServiceSet();

/**
 * Helper for registering OAuth based accounts packages.
 */
export const registerService = <T extends string>(name: T) => {
	services.add(name);
};

/**
 * Removes a previously registered service.
 * This will disable logging in with this service, and serviceNames() will not
 * contain it.
 * It's worth noting that already logged in users will remain logged in unless
 * you manually expire their sessions.
 */
export const unregisterService = <T extends string>(name: T) => {
	services.delete(name);
};

export const serviceNames = () => services;
