import type { IRoom } from '@rocket.chat/core-typings';

import { t } from '../../../../app/utils/lib/i18n';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { dispatchToastMessage } from '../../../lib/toast';

export const scheduleMessage = async ({
	rid,
	msg,
	scheduledAt,
	tmid,
}: {
	rid: IRoom['_id'];
	msg: string;
	scheduledAt: Date;
	tmid?: string;
}): Promise<void> => {
	try {
		await sdk.rest.post('/v1/chat.scheduleMessage', {
			roomId: rid,
			message: msg,
			scheduledAt: scheduledAt.toISOString(),
			...(tmid && { tmid }),
		});

		dispatchToastMessage({ type: 'success', message: t('Message_sent') });
	} catch (error: any) {
		dispatchToastMessage({ type: 'error', message: error.message || t('Error') });
		throw error;
	}
};
