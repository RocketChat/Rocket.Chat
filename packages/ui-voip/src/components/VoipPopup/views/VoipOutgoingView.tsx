import { useTranslation } from 'react-i18next';

import { VoipActions as Actions, VoipContactId as CallContactId } from '../..';
import type { VoipOutgoingSession } from '../../../definitions';
import { useVoipContactId } from '../../../hooks/useVoipContactId';
import Container from '../components/VoipPopupContainer';
import type { PositionOffsets } from '../components/VoipPopupContainer';
import Content from '../components/VoipPopupContent';
import Footer from '../components/VoipPopupFooter';
import Header from '../components/VoipPopupHeader';

type VoipOutgoingViewProps = {
	session: VoipOutgoingSession;
	position?: PositionOffsets;
};

const VoipOutgoingView = ({ session, position }: VoipOutgoingViewProps) => {
	const { t } = useTranslation();
	const contactData = useVoipContactId({ session });

	return (
		<Container data-testid='vc-popup-outgoing' position={position}>
			<Header>{`${t('Calling')}...`}</Header>

			<Content>
				<CallContactId {...contactData} />
			</Content>

			<Footer>
				<Actions onEndCall={session.end} />
			</Footer>
		</Container>
	);
};

export default VoipOutgoingView;
