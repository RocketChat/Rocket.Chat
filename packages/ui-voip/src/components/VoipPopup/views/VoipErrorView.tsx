import { Box, Icon } from '@rocket.chat/fuselage';
import { useMemo, forwardRef, Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { VoipActions as Actions, VoipContactId as CallContactId } from '../..';
import type { VoipErrorSession } from '../../../definitions';
import { useVoipContactId } from '../../../hooks/useVoipContactId';
import Container from '../components/VoipPopupContainer';
import type { PositionOffsets } from '../components/VoipPopupContainer';
import Content from '../components/VoipPopupContent';
import VoipPopupDragHandle from '../components/VoipPopupDragHandle';
import Footer from '../components/VoipPopupFooter';
import Header from '../components/VoipPopupHeader';

type VoipErrorViewProps = {
	session: VoipErrorSession;
	position?: PositionOffsets;
	dragHandleRef?: Ref<HTMLElement>;
};

const VoipErrorView = forwardRef<HTMLDivElement, VoipErrorViewProps>(({ session, position, dragHandleRef }, ref) => {
	const { t } = useTranslation();
	const contactData = useVoipContactId({ session });

	const { status } = session.error;

	const title = useMemo(() => {
		switch (status) {
			case 487:
				return t('Call_terminated');
			case 486:
				return t('Caller_is_busy');
			case 480:
				return t('Temporarily_unavailable');
			default:
				return t('Unable_to_complete_call');
		}
	}, [status, t]);

	return (
		<Container ref={ref} data-testid='vc-popup-error' position={position}>
			<VoipPopupDragHandle ref={dragHandleRef}>
				<Header hideSettings>
					<Box fontScale='p2' color='danger' fontWeight={700}>
						<Icon name='warning' size={16} /> {title}
					</Box>
				</Header>

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

VoipErrorView.displayName = 'VoipErrorView';

export default VoipErrorView;
