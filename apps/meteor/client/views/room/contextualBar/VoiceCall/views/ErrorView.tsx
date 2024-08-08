import React from 'react';

import type { VoiceCallErrorSession } from '../../../../../contexts/VoiceCallContext';
import { Actions, Container, Footer, Header } from '../components';

export const VoiceCallErrorView = ({ session }: { session: VoiceCallErrorSession }) => {
	return (
		<Container>
			<Header title={session.error.reason} hideSettings />
			<Footer>
				<Actions session={session} />
			</Footer>
		</Container>
	);
};

export default VoiceCallErrorView;
