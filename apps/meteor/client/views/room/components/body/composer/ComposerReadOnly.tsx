import { Button } from '@rocket.chat/fuselage';
import { MessageFooterCallout, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useRef, useEffect } from 'react';

import { dispatchToastMessage } from '../../../../../lib/toast';
import { useRoom, useUserIsSubscribed } from '../../../contexts/RoomContext';

export const ComposerReadOnly = (): ReactElement => {
	const t = useTranslation();
	const room = useRoom();
	const isSubscribed = useUserIsSubscribed();
	const calloutRef = useRef() as React.MutableRefObject<HTMLButtonElement>;
	const joinChannel = useEndpoint('POST', '/v1/channels.join');

	useEffect(() => {
		if (!calloutRef.current) {
			return;
		}
		calloutRef.current.style.flex = !isSubscribed ? '4' : 'none';
	}, [isSubscribed]);

	const join = useCallback(async () => {
		try {
			await joinChannel({ roomId: room._id });
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [joinChannel, room._id]);

	return (
		<footer className='rc-message-box footer'>
			<MessageFooterCallout>
				<MessageFooterCalloutContent ref={calloutRef}>{t('room_is_read_only')}</MessageFooterCalloutContent>
				{!isSubscribed && (
					<Button primary onClick={join}>
						{t('Join')}
					</Button>
				)}
			</MessageFooterCallout>
		</footer>
	);
};
