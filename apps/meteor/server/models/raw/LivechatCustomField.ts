import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import type { ILivechatCustomFieldModel } from '@rocket.chat/model-typings';

import { BaseRaw } from './BaseRaw';

export class LivechatCustomFieldRaw extends BaseRaw<ILivechatCustomField> implements ILivechatCustomFieldModel {}
