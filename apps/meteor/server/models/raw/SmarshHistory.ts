import type { ISmarshHistory } from '@rocket.chat/core-typings';
import type { ISmarshHistoryModel } from '@rocket.chat/model-typings';

import { BaseRaw } from './BaseRaw';

export class SmarshHistoryRaw extends BaseRaw<ISmarshHistory> implements ISmarshHistoryModel {}
