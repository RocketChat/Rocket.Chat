import { IndexSpecification } from 'mongodb';

import { IAppsPersistenceModel as T } from '../../../../definition/IAppsPersistenceModel';
import { BaseRaw } from './BaseRaw';

export class AppsPersistenceModelRaw extends BaseRaw<T> {
	protected indexes: IndexSpecification[] = [{ key: { appId: 1 } }, { key: { associations: 1 } }];
}
