import React from 'react';
import { useTranslation } from 'react-i18next';

import type { VoiceCallOutgoingSession } from '../../../../../contexts/VoiceCallContext';
import { Actions, CallContactID, Container, Footer, Header } from '../components';

export const VoiceCallOutgoingView = ({ session }: { session: VoiceCallOutgoingSession }) => {
	const { t } = useTranslation();

	return (
		<Container>
			<Header title={`${t('Calling')}...`} />

			<section>
				<CallContactID session={session} />
			</section>

			<Footer>
				<Actions session={session} />
			</Footer>
		</Container>
	);
};

export default VoiceCallOutgoingView;
