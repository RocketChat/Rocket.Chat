import { registerModel } from '@rocket.chat/models';

import { InstanceStatusRaw } from './raw/InstanceStatus';

registerModel('IInstanceStatusModel', new InstanceStatusRaw());
