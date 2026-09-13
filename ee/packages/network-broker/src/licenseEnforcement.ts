const { LICENSE_CHECK_INTERVAL = '20', MAX_FAILS = '2' } = process.env;

const checkInterval = (parseInt(LICENSE_CHECK_INTERVAL) || 20) * 1000;
const maxFails = parseInt(MAX_FAILS) || 2;

export type ServiceNodes = { name: string; nodes: string[] };

export type LicenseEnforcementOptions = {
	serviceName: string;
	nodeID: string;
	hasValidLicense(): Promise<boolean>;
	listServices(): Promise<ServiceNodes[]>;
	fatal(message: string): void;
};

/**
 * The main idea is if there is no scalability module enabled, then we should not
 * allow more than one service per environment. So we list the services and
 * nodes, and if there is more than one, we say it should be shutdown.
 */
export function shouldShutdown(serviceName: string, nodeID: string, services: ServiceNodes[]): boolean {
	const currentService = services.find((service) => service.name === serviceName);

	// if current service is not on the list maybe it is already shut down?
	if (!currentService) {
		return true;
	}

	const [firstNode, ...otherNodes] = [...currentService.nodes].sort();

	// if the first node is the current node and there are others nodes running the same service or
	// if this is the only one node online, then we should shutdown
	return firstNode === nodeID && (otherNodes.length > 0 || services.length === 1);
}

/**
 * Transport agnostic license enforcement, shared by every broker implementation
 * so the policy lives in one place. Returns a function that stops the check.
 */
export function startLicenseEnforcement({
	serviceName,
	nodeID,
	hasValidLicense,
	listServices,
	fatal,
}: LicenseEnforcementOptions): () => void {
	let checkFails = 0;

	const check = async (): Promise<void> => {
		try {
			if (await hasValidLicense()) {
				checkFails = 0;
				return;
			}
		} catch {
			// check failed, so continue
		}

		if (++checkFails < maxFails) {
			return;
		}

		try {
			if (shouldShutdown(serviceName, nodeID, await listServices())) {
				fatal('Enterprise license not found. Shutting down...');
			}
		} catch {
			// could not list the services, try again on the next interval
		}
	};

	const timer = setInterval(() => void check(), checkInterval);

	return (): void => clearInterval(timer);
}
