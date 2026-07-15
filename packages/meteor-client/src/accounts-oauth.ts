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

export const registerService = <T extends string>(name: T) => {
	services.add(name);
};

export const unregisterService = <T extends string>(name: T) => {
	services.delete(name);
};

export const serviceNames = () => services;
