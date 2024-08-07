import { Box, IconButton, Skeleton } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { VoiceCallIncomingSession, VoiceCallOngoingSession, VoiceCallOutgoingSession } from '../../../../../contexts/VoiceCallContext';

const CallContactID = ({ session }: { session: VoiceCallIncomingSession | VoiceCallOngoingSession | VoiceCallOutgoingSession }) => {
	const getContactDetails = useEndpoint('GET', '/v1/voip-freeswitch.extension.getDetails');
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const { data, isLoading } = useQuery(
		['voice-call', session.contact.id, getContactDetails],
		() => getContactDetails({ extension: session?.contact.id || '' }),
		{
			enabled: !!session.contact.id,
		},
	);

	const { name, username = '', callerName, callerNumber } = data || {};
	const contactName = name || callerName || callerNumber || session.contact.name;

	const handleCopy = useMutation({
		mutationFn: (contactName: string) => navigator.clipboard.writeText(contactName),
		onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Phone_number_copied') }),
		onError: () => dispatchToastMessage({ type: 'error', message: t('Failed_to_copy_phone_number') }),
	});

	const content = useMemo(() => {
		if (isLoading) {
			return (
				<>
					<Skeleton variant='rect' size={20} mie={8} />
					<Skeleton variant='text' width={100} height={16} />
				</>
			);
		}

		if (username) {
			return (
				<>
					<UserAvatar username={username} size='x20' />
					<Box mis={8} color='secondary-info'>
						{contactName}
					</Box>
				</>
			);
		}

		if (contactName) {
			return (
				<>
					<Box withTruncatedText is='p' pie={6} mie='auto' flexGrow={1} title={contactName}>
						{contactName}
					</Box>
					<IconButton mini icon='copy' onClick={() => handleCopy.mutate(contactName)} />
				</>
			);
		}

		return null;
	}, [isLoading, contactName, username, handleCopy]);

	if (!session) {
		return null;
	}

	return (
		<Box is='section' display='flex' pi={12} pb={8}>
			{content}
		</Box>
	);
};

export default CallContactID;
