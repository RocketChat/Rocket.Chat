import { useTranslation } from 'react-i18next';

import { VoipActions as Actions, VoipContactId as CallContactId } from '../..';
import type { VoipIncomingSession } from '../../../definitions';
import { useVoipContactId } from '../../../hooks/useVoipContactId';
import Container from '../components/VoipPopupContainer';
import type { PositionOffsets } from '../components/VoipPopupContainer';
import Content from '../components/VoipPopupContent';
import Footer from '../components/VoipPopupFooter';
import Header from '../components/VoipPopupHeader';

type VoipIncomingViewProps = {
	session: VoipIncomingSession;
	position?: PositionOffsets;
};

const VoipIncomingView = ({ session, position }: VoipIncomingViewProps) => {
	const { t } = useTranslation();
	const contactData = useVoipContactId({ session });

	return (
		<Container data-testid='vc-popup-incoming' position={position}>
			<Header>{`${session.transferedBy ? t('Incoming_call_transfer') : t('Incoming_call')}...`}</Header>

			<Content>
				<CallContactId {...contactData} />
			</Content>

			<Footer>
				<Actions onAccept={session.accept} onDecline={session.end} />
			</Footer>
		</Container>
	);
};

export default VoipIncomingView;
