import { Button } from '@rocket.chat/fuselage';
import { MessageFooterCallout, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useRef, useEffect } from 'react';

import { useRoom, useUserIsSubscribed } from '../../../contexts/RoomContext';

export const ComposerReadOnly = (): ReactElement => {
	const t = useTranslation();
	const room = useRoom();
	const isSubscribed = useUserIsSubscribed();
	const calloutRef = useRef() as React.MutableRefObject<HTMLButtonElement>;
	const joinEndpoint = useEndpoint('POST', '/v1/channels.join');

	useEffect(() => {
		calloutRef.current.style.flex = !isSubscribed ? '4' : 'none';
	}, [isSubscribed]);

	const join = useCallback(
		async (_e) => {
			try {
				await joinEndpoint({ roomId: room._id });
			} catch (error: any) {
				console.log(error);
			}
		},
		[joinEndpoint, room._id],
	);

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
