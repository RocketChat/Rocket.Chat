import type { ISmarshHistory } from '@rocket.chat/core-typings';
import type { ISmarshHistoryModel } from '@rocket.chat/model-typings';

import { ModelClass } from './ModelClass';

export class SmarshHistoryRaw extends ModelClass<ISmarshHistory> implements ISmarshHistoryModel {}
