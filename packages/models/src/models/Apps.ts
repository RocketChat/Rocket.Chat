import type { IAppsModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { model } from '../proxify';

@model()
export class AppsModel extends BaseRaw<any> implements IAppsModel {
	constructor(db: Db) {
		super(db, 'apps');
	}
}
