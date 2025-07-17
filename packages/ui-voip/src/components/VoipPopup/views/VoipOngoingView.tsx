import { useState, forwardRef, Ref } from 'react';

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
	dragHandleRef?: Ref<HTMLElement>;
};

const VoipOngoingView = forwardRef<HTMLDivElement, VoipOngoingViewProps>(function VoipOngoingView({ session, position, ...props }, ref) {
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
		<Container ref={ref} data-testid='vc-popup-ongoing' position={position} {...props}>
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
});

export default VoipOngoingView;
