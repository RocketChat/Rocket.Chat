import { MessageFooterCallout, MessageFooterCalloutAction, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useOmnichannelRoom } from '../../contexts/RoomContext';

export const ComposerOmnichannelJoin = (): ReactElement => {
	const room = useOmnichannelRoom();
	const join = useEndpoint('GET', `/v1/livechat/room.join`);

	const dispatchToastMessage = useToastMessageDispatch();

	const { t } = useTranslation();
	return (
		<MessageFooterCallout>
			<MessageFooterCalloutContent>{t('room_is_read_only')}</MessageFooterCalloutContent>
			<MessageFooterCalloutAction
				onClick={async (): Promise<void> => {
					try {
						await join({
							roomId: room._id,
						});
					} catch (error) {
						dispatchToastMessage({ type: 'error', message: error });
					}
				}}
			>
				{t('Join')}
			</MessageFooterCalloutAction>
		</MessageFooterCallout>
	);
};
