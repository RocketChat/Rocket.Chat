import { Box } from '@rocket.chat/fuselage';
import React, { useState } from 'react';

import type { VoiceCallOngoingSession } from '../../../../../contexts/VoiceCallContext';
import { Actions, CallContactID, Container, DialPad, Footer, Header, Timer, Status } from '../components';
import useVoiceCallTransferModal from '../hooks/useVoiceCallTransferModal';

export const VoiceCallOngoingView = ({ session }: { session: VoiceCallOngoingSession }) => {
	const { startTransfer } = useVoiceCallTransferModal({ session });
	const [isDialPadOpen, setDialerOpen] = useState(false);
	const [dtmfValue, setDTMF] = useState('');

	const handleDTMF = (value: string, digit: string) => {
		setDTMF(value);
		session.dtmf(digit);
	};

	return (
		<Container secondary>
			<Header title={<Timer />} />

			<Box is='section'>
				<Status session={session} />
			</Box>

			<Box is='section'>
				<CallContactID session={session} />
			</Box>

			<Box is='section' aria-hidden={!isDialPadOpen}>
				{isDialPadOpen && <DialPad value={dtmfValue} onChange={handleDTMF} />}
			</Box>

			<Footer>
				<Actions session={session} isDTMFActive={isDialPadOpen} onDTMF={() => setDialerOpen(!isDialPadOpen)} onTransfer={startTransfer} />
			</Footer>
		</Container>
	);
};

export default VoiceCallOngoingView;
