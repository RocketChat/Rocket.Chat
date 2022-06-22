import type { UpdateWriteOpResult } from 'mongodb';
import type { IFederationServer } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IFederationServersModel extends IBaseModel<IFederationServer> {
	saveDomain(domain: string): Promise<UpdateWriteOpResult>;
	refreshServers(): Promise<void>;
}
