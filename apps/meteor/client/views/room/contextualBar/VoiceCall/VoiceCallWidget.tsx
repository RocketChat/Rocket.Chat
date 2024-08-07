import React from 'react';

import useVoiceCallDialer from '../../../../hooks/voiceCall/useVoiceCallDialer';
import useVoiceCallSession from '../../../../hooks/voiceCall/useVoiceCallSession';
import Dialer from './views/Dialer';
import ErrorView from './views/ErrorView';
import IncomingView from './views/IncomingView';
import OngoingView from './views/OngoingView';
import OutgoingView from './views/OutgoingView';

const VoiceCallWidget = () => {
	const session = useVoiceCallSession();
	const { open: isDialerOpen } = useVoiceCallDialer();

	return (
		<>
			{!session && isDialerOpen && <Dialer />}
			{session?.type === 'INCOMING' && <IncomingView session={session} />}
			{session?.type === 'ONGOING' && <OngoingView session={session} />}
			{session?.type === 'OUTGOING' && <OutgoingView session={session} />}
			{session?.type === 'ERROR' && <ErrorView session={session} />}
		</>
	);
};

export default VoiceCallWidget;
