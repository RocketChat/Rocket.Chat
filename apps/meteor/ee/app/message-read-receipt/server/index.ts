import { License } from '@rocket.chat/license';

await License.onLicense('message-read-receipt', async () => {
	await import('../../../server/hooks/messages/afterReadMessages');
	await import('../../../server/hooks/messages/afterSaveMessage');
	await import('../../../server/hooks/messages/afterDeleteRoom');
});
