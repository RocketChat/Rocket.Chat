import type { IInstanceStatus } from '@rocket.chat/core-typings';
import type { IInstanceStatusModel } from '@rocket.chat/model-typings';

import { ModelClass } from './ModelClass';

export class InstanceStatusRaw extends ModelClass<IInstanceStatus> implements IInstanceStatusModel {}
