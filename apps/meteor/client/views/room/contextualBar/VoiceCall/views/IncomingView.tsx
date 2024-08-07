import { Box } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { VoiceCallIncomingSession } from '../../../../../contexts/VoiceCallContext';
import { Actions, CallContactID, Container, Footer, Header } from '../components';

export const VoiceCallIncomingView = ({ session }: { session: VoiceCallIncomingSession }) => {
	const { t } = useTranslation();

	return (
		<Container>
			<Header title={`${t('Incoming')}...`} />

			<Box is='section'>
				<CallContactID session={session} />
			</Box>

			<Footer>
				<Actions session={session} />
			</Footer>
		</Container>
	);
};

export default VoiceCallIncomingView;
