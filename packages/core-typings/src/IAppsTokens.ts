import type { IRocketChatRecord } from './IRocketChatRecord';
import type { Brand } from './utils';

// The above to a ts interface
export interface IAppsTokens extends IRocketChatRecord {
	_id: string & Brand<'apps-token-id'>;
	token: { apn: string } | { gcm: string };
	authToken: string;
	appName: string;
	userId: string | null;
	metadata: Record<string, any>;
	enabled: boolean;
	createdAt: Date;
	updatedAt: Date;
}
