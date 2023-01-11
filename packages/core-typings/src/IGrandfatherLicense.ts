import type { IRocketChatRecord } from './IRocketChatRecord';

// This document will be used for Grandfathering existing CE users and provide them with a free module of Enterprise licenses.
// Any modifications to this document will not be allowed as per the grandfathering policy.
export interface IGrandfatherLicense extends IRocketChatRecord {
	allowedModule: 'livechat-department-enterprise';
}
