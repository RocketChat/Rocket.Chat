import { MessageTypes } from '../../../../app/ui-utils/client';
import { t } from '../../../../app/utils/lib/i18n';

MessageTypes.registerType({
	id: 'livechat_transfer_history_fallback',
	system: true,
	message: 'New_chat_transfer_fallback',
	data(message: any) {
		if (!message.transferData) {
			return {
				fallback: 'SHOULD_NEVER_HAPPEN',
			};
		}
		const from = message.transferData.prevDepartment;
		const to = message.transferData.department.name;

		return {
			fallback: t('Livechat_transfer_failed_fallback', { from, to }),
		};
	},
});
