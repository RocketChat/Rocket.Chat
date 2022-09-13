import { TextInput } from '@rocket.chat/fuselage';
import { MessageComposerDisabled, MessageComposerDisabledAction, MessageComposerDisabledDivider } from '@rocket.chat/ui-composer';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import React, { ChangeEvent, ReactElement, useCallback, useState, FormEventHandler } from 'react';

import { useRoom } from '../../../contexts/RoomContext';

export const ComposerJoinWithPassword = (): ReactElement => {
	const room = useRoom();
	const [joinCode, setJoinPassword] = useState<string>('');

	const [error, setError] = useState<string>('');

	const t = useTranslation();

	const joinEndpoint = useEndpoint('POST', '/v1/channels.join');

	const join = useCallback<FormEventHandler<HTMLElement>>(
		async (e) => {
			e.preventDefault();
			try {
				await joinEndpoint({
					roomId: room._id,
					joinCode,
				});
			} catch (error: any) {
				setError(error.error);
			}
		},
		[joinEndpoint, room._id, joinCode],
	);

	const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setJoinPassword(e.target.value);
		setError('');
	}, []);

	return (
		<MessageComposerDisabled is='form' aria-label={t('Join_with_password')} onSubmit={join}>
			{t('you_are_in_preview')}
			<MessageComposerDisabledDivider />
			<TextInput error={error} value={joinCode} onChange={handleChange} placeholder={t('you_are_in_preview_please_insert_the_password')} />
			<MessageComposerDisabledAction type='submit' disabled={Boolean(!joinCode)}>
				{t('Join_with_password')}
			</MessageComposerDisabledAction>
		</MessageComposerDisabled>
	);
};
