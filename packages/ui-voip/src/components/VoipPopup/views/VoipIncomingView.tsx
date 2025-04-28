import { forwardRef, Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { VoipActions as Actions, VoipContactId as CallContactId } from '../..';
import type { VoipIncomingSession } from '../../../definitions';
import { useVoipContactId } from '../../../hooks/useVoipContactId';
import Container from '../components/VoipPopupContainer';
import type { PositionOffsets } from '../components/VoipPopupContainer';
import Content from '../components/VoipPopupContent';
import VoipPopupDragHandle from '../components/VoipPopupDragHandle';
import Footer from '../components/VoipPopupFooter';
import Header from '../components/VoipPopupHeader';

type VoipIncomingViewProps = {
	session: VoipIncomingSession;
	position?: PositionOffsets;
	dragHandleRef?: Ref<HTMLElement>;
};

const VoipIncomingView = forwardRef<HTMLDivElement, VoipIncomingViewProps>(({ session, position, dragHandleRef, ...props }, ref) => {
	const { t } = useTranslation();
	const contactData = useVoipContactId({ session });

	return (
		<Container ref={ref} data-testid='vc-popup-incoming' position={position} {...props}>
			<VoipPopupDragHandle ref={dragHandleRef}>
				<Header>{`${session.transferedBy ? t('Incoming_call_transfer') : t('Incoming_call')}...`}</Header>

				<Content>
					<CallContactId {...contactData} />
				</Content>
			</VoipPopupDragHandle>

			<Footer>
				<Actions onAccept={session.accept} onDecline={session.end} />
			</Footer>
		</Container>
	);
});

VoipIncomingView.displayName = 'VoipIncomingView';

export default VoipIncomingView;
