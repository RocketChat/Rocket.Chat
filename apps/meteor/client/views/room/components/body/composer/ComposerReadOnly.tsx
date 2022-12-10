import { MessageFooterCallout, MessageFooterCalloutAction, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { FormEventHandler, ReactElement, useCallback } from 'react';
import React from 'react';
import { useRoom } from '../../../contexts/RoomContext';
import { ComposerMessageProps } from './ComposerMessage';
import { useUserIsSubscribed } from '../../../contexts/RoomContext';

export const ComposerReadOnly = (props: ComposerMessageProps): ReactElement => {
	const t = useTranslation();
	const room = useRoom();
	const isSubscribed = useUserIsSubscribed();
	const joinEndpoint = useEndpoint('POST', '/v1/channels.join');

	const join = useCallback<FormEventHandler<HTMLElement>>(
		async (_e) => {
			try {
				if (props.chatMessagesInstance){
					await props.chatMessagesInstance.data.joinRoom();
				}
				else {
					console.log("chat messages undefined");
				}
				
			} catch (error: any) {
				console.log(error);
			}
		},
		[joinEndpoint, room._id],
	);

	return (
			<MessageFooterCallout is='form' aria-label={t('Join')} onSubmit={join}>
				<MessageFooterCalloutContent>{t('room_is_read_only')}</MessageFooterCalloutContent>
				<MessageFooterCalloutAction type='submit' disabled={isSubscribed} >{t('Join')}</MessageFooterCalloutAction>
			</MessageFooterCallout>
	);
};
