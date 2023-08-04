import type { IFederationServer } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IFederationServersModel extends IBaseModel<IFederationServer> {
	saveDomain(domain: string): Promise<UpdateResult>;
	refreshServers(): Promise<void>;
}
