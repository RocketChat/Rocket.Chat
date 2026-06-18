import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUserStatus } from './IUserStatus';

export interface ICustomUserStatus extends IUserStatus, IRocketChatRecord {}
