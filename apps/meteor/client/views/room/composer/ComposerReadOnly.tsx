import { Button } from '@rocket.chat/fuselage';
import { MessageFooterCallout, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoom, useUserIsSubscribed } from '../contexts/RoomContext';

const ComposerReadOnly = (): ReactElement => {
	const { t } = useTranslation();
	const room = useRoom();
	const isSubscribed = useUserIsSubscribed();
	const joinChannel = useEndpoint('POST', '/v1/channels.join');

	const dispatchToastMessage = useToastMessageDispatch();

	const join = useMutation({
		mutationFn: () => joinChannel({ roomId: room._id }),

		onError: (error: unknown) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	return (
		<MessageFooterCallout>
			<MessageFooterCalloutContent>{t('room_is_read_only')}</MessageFooterCalloutContent>
			{!isSubscribed && (
				<Button primary onClick={() => join.mutate()} loading={join.isPending}>
					{t('Join')}
				</Button>
			)}
		</MessageFooterCallout>
	);
};

export default ComposerReadOnly;
