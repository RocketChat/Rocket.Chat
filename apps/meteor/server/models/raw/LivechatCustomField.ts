import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import type { ILivechatCustomFieldModel } from '@rocket.chat/model-typings';

import { ModelClass } from './ModelClass';

export class LivechatCustomFieldRaw extends ModelClass<ILivechatCustomField> implements ILivechatCustomFieldModel {}
