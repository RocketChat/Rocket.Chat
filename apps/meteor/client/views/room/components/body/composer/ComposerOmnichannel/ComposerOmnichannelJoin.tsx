import { MessageComposerDisabled, MessageComposerDisabledAction } from '@rocket.chat/ui-composer';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useOmnichannelRoom } from '../../../../contexts/RoomContext';

export const ComposerOmnichannelJoin = (): ReactElement => {
	const room = useOmnichannelRoom();
	const join = useEndpoint('GET', `/v1/livechat/room.join`);

	const dispatchToastMessage = useToastMessageDispatch();

	const t = useTranslation();
	return (
		<footer className='rc-message-box footer'>
			<MessageComposerDisabled>
				{t('room_is_read_only')}
				<MessageComposerDisabledAction
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
				</MessageComposerDisabledAction>
			</MessageComposerDisabled>
		</footer>
	);
};
