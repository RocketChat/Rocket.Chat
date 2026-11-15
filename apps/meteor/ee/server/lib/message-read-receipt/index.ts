import { License } from '@rocket.chat/license';

await License.onLicense('message-read-receipt', async () => {
	await import('../../hooks/messages/afterReadMessages');
	await import('../../hooks/messages/afterSaveMessage');
	await import('../../hooks/messages/afterDeleteRoom');
});
