import { forwardRef, Ref } from 'react';

import { isVoipErrorSession, isVoipIncomingSession, isVoipOngoingSession, isVoipOutgoingSession } from '../../definitions';
import type { PositionOffsets } from './components/VoipPopupContainer';
import DialerView from './views/VoipDialerView';
import ErrorView from './views/VoipErrorView';
import IncomingView from './views/VoipIncomingView';
import OngoingView from './views/VoipOngoingView';
import OutgoingView from './views/VoipOutgoingView';
import { useVoipDialer } from '../../hooks/useVoipDialer';
import { useVoipSession } from '../../hooks/useVoipSession';

type VoipPopupProps = {
	position?: PositionOffsets;
	dragHandleRef?: Ref<HTMLElement>;
};

const VoipPopup = forwardRef<HTMLDivElement, VoipPopupProps>(({ position, ...props }, ref) => {
	const session = useVoipSession();
	const { open: isDialerOpen } = useVoipDialer();

	if (isVoipIncomingSession(session)) {
		return <IncomingView ref={ref} session={session} position={position} {...props} />;
	}

	if (isVoipOngoingSession(session)) {
		return <OngoingView ref={ref} session={session} position={position} {...props} />;
	}

	if (isVoipOutgoingSession(session)) {
		return <OutgoingView ref={ref} session={session} position={position} {...props} />;
	}

	if (isVoipErrorSession(session)) {
		return <ErrorView ref={ref} session={session} position={position} {...props} />;
	}

	if (isDialerOpen) {
		return <DialerView ref={ref} position={position} {...props} />;
	}

	return null;
});

VoipPopup.displayName = 'VoipPopup';

export default VoipPopup;
