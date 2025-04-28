import { forwardRef, Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { VoipActions as Actions, VoipContactId as CallContactId } from '../..';
import type { VoipOutgoingSession } from '../../../definitions';
import { useVoipContactId } from '../../../hooks/useVoipContactId';
import Container from '../components/VoipPopupContainer';
import type { PositionOffsets } from '../components/VoipPopupContainer';
import Content from '../components/VoipPopupContent';
import VoipPopupDragHandle from '../components/VoipPopupDragHandle';
import Footer from '../components/VoipPopupFooter';
import Header from '../components/VoipPopupHeader';

type VoipOutgoingViewProps = {
	session: VoipOutgoingSession;
	position?: PositionOffsets;
	dragHandleRef?: Ref<HTMLElement>;
};

const VoipOutgoingView = forwardRef<HTMLDivElement, VoipOutgoingViewProps>(({ session, position, dragHandleRef }, ref) => {
	const { t } = useTranslation();
	const contactData = useVoipContactId({ session });

	return (
		<Container ref={ref} data-testid='vc-popup-outgoing' position={position}>
			<VoipPopupDragHandle ref={dragHandleRef}>
				<Header>{`${t('Calling')}...`}</Header>

				<Content>
					<CallContactId {...contactData} />
				</Content>
			</VoipPopupDragHandle>

			<Footer>
				<Actions onEndCall={session.end} />
			</Footer>
		</Container>
	);
});

VoipOutgoingView.displayName = 'VoipOutgoingView';

export default VoipOutgoingView;
