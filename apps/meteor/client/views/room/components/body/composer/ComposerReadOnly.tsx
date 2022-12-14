import { MessageFooterCallout, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useRef, useEffect } from 'react';

import { call } from '../../../../../lib/utils/call';
import { useRoom, useUserIsSubscribed } from '../../../contexts/RoomContext';

export const ComposerReadOnly = (): ReactElement => {
	const t = useTranslation();
	const room = useRoom();
	const isSubscribed = useUserIsSubscribed();
	const calloutRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

	useEffect(() => {
		calloutRef.current.style.flex = !isSubscribed ? '4' : 'none';
	}, [isSubscribed]);

	const join = useCallback(
		async (_e) => {
			try {
				await call('joinRoom', room._id);
			} catch (error: any) {
				console.log(error);
			}
		},
		[room._id],
	);

	return (
		<footer className='rc-message-box footer'>
			<MessageFooterCallout>
				<MessageFooterCalloutContent ref={calloutRef}>{t('room_is_read_only')}</MessageFooterCalloutContent>
				{!isSubscribed && (
					<button className='rc-button rc-button--primary rc-button--medium' onClick={join}>
						{t('Join')}
					</button>
				)}
			</MessageFooterCallout>
		</footer>
	);
};
