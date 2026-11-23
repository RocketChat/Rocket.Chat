import type { IRocketChatRecord } from './IRocketChatRecord.js';
import type { IUserStatus } from './IUserStatus.js';

export interface ICustomUserStatus extends IUserStatus, IRocketChatRecord {}
