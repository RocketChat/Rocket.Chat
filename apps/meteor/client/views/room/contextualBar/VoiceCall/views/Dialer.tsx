import { Box, Button } from '@rocket.chat/fuselage';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import useVoiceCallAPI from '../../../../../hooks/voiceCall/useVoiceCallAPI';
import { Container, DialPad, Footer, Header, SettingsButton } from '../components';

export const VoiceCallDialer = () => {
	const { t } = useTranslation();
	const { makeCall, closeDialer } = useVoiceCallAPI();
	const [number, setNumber] = useState('');

	const handleCall = () => {
		makeCall(number);
		closeDialer();
	};

	return (
		<Container secondary>
			<Header title={t('New_Call')} hideSettings onClose={closeDialer} />

			<Box is='section'>
				<DialPad editable value={number} onChange={(value) => setNumber(value)} />
			</Box>

			<Footer>
				<SettingsButton />
				<Button medium success icon='phone' disabled={!number} flexGrow={1} onClick={handleCall}>
					{t('Call')}
				</Button>
			</Footer>
		</Container>
	);
};

export default VoiceCallDialer;
