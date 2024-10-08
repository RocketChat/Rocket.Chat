import { useState } from 'react';

import {
	VoipActions as Actions,
	VoipContactId as CallContactId,
	VoipStatus as Status,
	VoipDialPad as DialPad,
	VoipTimer as Timer,
} from '../..';
import type { VoipOngoingSession } from '../../../definitions';
import { useVoipContactId } from '../../../hooks/useVoipContactId';
import { useVoipTransferModal } from '../../../hooks/useVoipTransferModal';
import Container from '../components/VoipPopupContainer';
import type { PositionOffsets } from '../components/VoipPopupContainer';
import Content from '../components/VoipPopupContent';
import Footer from '../components/VoipPopupFooter';
import Header from '../components/VoipPopupHeader';

type VoipOngoingViewProps = {
	session: VoipOngoingSession;
	position?: PositionOffsets;
};

const VoipOngoingView = ({ session, position }: VoipOngoingViewProps) => {
	const { startTransfer } = useVoipTransferModal({ session });
	const contactData = useVoipContactId({ session, transferEnabled: false });

	const [isDialPadOpen, setDialerOpen] = useState(false);
	const [dtmfValue, setDTMF] = useState('');

	const handleDTMF = (value: string, digit: string) => {
		setDTMF(value);
		if (digit) {
			session.dtmf(digit);
		}
	};

	return (
		<Container secondary data-testid='vc-popup-ongoing' position={position}>
			<Header>
				<Timer />
			</Header>

			<Content>
				<Status isMuted={session.isMuted} isHeld={session.isHeld} />

				<CallContactId {...contactData} />

				{isDialPadOpen && <DialPad value={dtmfValue} longPress={false} onChange={handleDTMF} />}
			</Content>

			<Footer>
				<Actions
					isMuted={session.isMuted}
					isHeld={session.isHeld}
					isDTMFActive={isDialPadOpen}
					onMute={session.mute}
					onHold={session.hold}
					onEndCall={session.end}
					onTransfer={startTransfer}
					onDTMF={() => setDialerOpen(!isDialPadOpen)}
				/>
			</Footer>
		</Container>
	);
};

export default VoipOngoingView;
