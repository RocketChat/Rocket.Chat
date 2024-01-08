import type { BrokerNode } from 'moleculer';

export interface IInstanceService {
	getInstances(): Promise<BrokerNode[]>;
}
