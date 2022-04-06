import type { ISmarshHistory } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

type T = ISmarshHistory;

export class SmarshHistoryRaw extends BaseRaw<T> {}
