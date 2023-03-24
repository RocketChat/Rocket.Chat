import type { Db } from 'mongodb';
import type { IRawImportsModel } from '@rocket.chat/model-typings';

import { BaseRaw } from './BaseRaw';

export class RawImports extends BaseRaw<any> implements IRawImportsModel {
	constructor(db: Db) {
		super(db, 'raw_imports');
	}
}
