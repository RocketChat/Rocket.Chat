import { registerModel } from '@rocket.chat/models';
import type { IInstanceStatusModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { InstanceStatusRaw } from './raw/InstanceStatus';

const col = db.collection('instances');
export const InstanceStatus = new InstanceStatusRaw(col, trashCollection, {
	preventSetUpdatedAt: true,
});

registerModel('IInstanceStatusModel', InstanceStatus as IInstanceStatusModel);
