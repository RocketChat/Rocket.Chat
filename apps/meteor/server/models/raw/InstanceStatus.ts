import type { IInstanceStatus } from '@rocket.chat/core-typings';
import type { IInstanceStatusModel } from '@rocket.chat/model-typings';

import { BaseRaw } from './BaseRaw';

export class InstanceStatusRaw extends BaseRaw<IInstanceStatus> implements IInstanceStatusModel {}
