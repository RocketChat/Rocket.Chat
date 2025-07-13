import type { AppStatusReport } from '@rocket.chat/core-services';
import type { BrokerNode } from 'moleculer';

export interface IInstanceService {
	getInstances(): Promise<BrokerNode[]>;
	getAppsStatusInInstances(): Promise<AppStatusReport>;
}
