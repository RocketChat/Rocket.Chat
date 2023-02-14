import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { InstanceStatusRaw } from './raw/InstanceStatus';

registerModel('IInstanceStatusModel', new InstanceStatusRaw(db));
