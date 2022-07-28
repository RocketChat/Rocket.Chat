import type { ILivechatUnitModel } from '@rocket.chat/model-typings';

import { LivechatDepartmentRaw } from '../../../../server/models/raw/LivechatDepartment';

export class LivechatUnitRaw extends LivechatDepartmentRaw implements ILivechatUnitModel {}
