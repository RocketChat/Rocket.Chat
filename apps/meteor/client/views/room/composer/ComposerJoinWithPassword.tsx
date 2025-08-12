import { PasswordInput } from '@rocket.chat/fuselage';
import { MessageFooterCallout, MessageFooterCalloutAction, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useTranslation, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useRoom } from '../contexts/RoomContext';

const ComposerJoinWithPassword = (): ReactElement => {
	const t = useTranslation();
	const room = useRoom();
	const dispatchToastMessage = useToastMessageDispatch();

	const joinChannelEndpoint = useEndpoint('POST', '/v1/channels.join');
	const {
		control,
		handleSubmit,
		setError,
		formState: { errors, isDirty },
	} = useForm({ defaultValues: { joinCode: '' } });

	const handleJoinChannel = async ({ joinCode }: { joinCode: string }) => {
		try {
			await joinChannelEndpoint({
				roomId: room._id,
				joinCode,
			});
		} catch (error: any) {
			setError('joinCode', { type: error.errorType, message: error.error });
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<MessageFooterCallout is='form' aria-label={t('Join_with_password')} onSubmit={handleSubmit(handleJoinChannel)}>
			<MessageFooterCalloutContent>{t('you_are_in_preview')}</MessageFooterCalloutContent>
			<MessageFooterCalloutContent>
				<Controller
					name='joinCode'
					control={control}
					render={({ field }) => (
						<PasswordInput error={errors.joinCode?.message} {...field} placeholder={t('you_are_in_preview_please_insert_the_password')} />
					)}
				/>
			</MessageFooterCalloutContent>
			<MessageFooterCalloutAction type='submit' disabled={!isDirty}>
				{t('Join_with_password')}
			</MessageFooterCalloutAction>
		</MessageFooterCallout>
	);
};

export default ComposerJoinWithPassword;
