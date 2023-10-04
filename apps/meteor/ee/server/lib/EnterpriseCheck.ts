import type { ServiceSchema } from 'moleculer';

const { LICENSE_CHECK_INTERVAL = '20', MAX_FAILS = '2' } = process.env;

let checkFails = 0;
const maxFails = parseInt(MAX_FAILS) || 2;

export const EnterpriseCheck: ServiceSchema = {
	name: 'EnterpriseCheck',
	methods: {
		/**
		 * The main idea is if there is no scalability module enabled,
		 * then we should not allow more than one service per environment.
		 * So we list the services and nodes, and if there is more than
		 * one, we say it should be shutdown.
		 */
		async shouldShutdown(): Promise<boolean> {
			const services: {
				name: string;
				nodes: string[];
			}[] = await this.broker.call('$node.services', { skipInternal: true });

			const currentService = services.find((service) => {
				return service.name === this.name;
			});

			// if current service is not on the list maybe it is already shut down?
			if (!currentService) {
				return true;
			}

			const { nodes } = currentService;

			const firstNode = nodes.sort().shift();

			// if the first node is the current node and there are others nodes running the same service or
			// if this is the only one node online, then we should shutdown
			return firstNode === this.broker.nodeID && (nodes.length > 0 || services.length === 1);
		},
	},
	async started(): Promise<void> {
		setInterval(async () => {
			try {
				const hasLicense = await this.broker.call('license.hasValidLicense', ['scalability']);
				if (hasLicense) {
					checkFails = 0;
					return;
				}
			} catch (e: unknown) {
				// check failed, so continue
			}

			if (++checkFails < maxFails) {
				return;
			}

			const shouldShutdown = await this.shouldShutdown();
			if (shouldShutdown) {
				this.broker.fatal('Enterprise license not found. Shutting down...');
			}
		}, (parseInt(LICENSE_CHECK_INTERVAL) || 20) * 1000);
	},
};
