import type { IInstanceStatus } from '@rocket.chat/core-typings';
import type { IInstanceStatusModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db } from '../database/utils';

export class InstanceStatus extends ModelClass<IInstanceStatus> implements IInstanceStatusModel {}

const col = db.collection('instances');
registerModel(
	'IInstanceStatusModel',
	new InstanceStatus(col, trashCollection, {
		preventSetUpdatedAt: true,
	}) as IInstanceStatusModel,
);
