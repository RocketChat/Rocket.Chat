/**
 * @see https://docs.meteor.com/api/accounts-oauth.html#AccountsOAuth-registerService
 */
class ServiceSet extends Set<string> {
	/**
	 * Checks whether the service is registered.
	 * @param service The service name.
	 * @return True if the service is registered. False otherwise.
	 */
	includes(service: string): boolean {
		return this.has(service);
	}

	/**
	 * Adds a new service to the set.
	 * @param service The service name.
	 * @return The updated set.
	 * @throws Error if the service is already registered.
	 */
	override add(service: string): this {
		if (this.has(service)) {
			throw new Error(`Duplicate service: ${service}`);
		}

		return super.add(service);
	}

	/**
	 * Removes a service from the set.
	 * @param service The service name.
	 * @return True if the service was removed. False if the service was not found.
	 * @throws Error if the service is not registered.
	 */
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
