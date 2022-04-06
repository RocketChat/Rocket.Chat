import { BaseRaw } from './BaseRaw';
import type { ISmarshHistory } from '@rocket.chat/core-typings';

type T = ISmarshHistory;

export class SmarshHistoryRaw extends BaseRaw<T> {}
