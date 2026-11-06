import { useUser } from '@rocket.chat/ui-contexts';
import { useVideoConfWindowEnabled } from '@rocket.chat/ui-video-conf';

import NavBarControls from './NavBarControls';
import OngoingCallsProvider from '../../views/conference/providers/OngoingCallsProvider';

const NavBarControlsSection = () => {
	const user = useUser();
	// The calls-already-running list has nothing to list without the call window, and asking for one would poll
	// for joinable calls a workspace has no way to join.
	const showOngoingCalls = useVideoConfWindowEnabled();

	if (user && showOngoingCalls) {
		return (
			<OngoingCallsProvider>
				<NavBarControls />
			</OngoingCallsProvider>
		);
	}

	return <NavBarControls />;
};

export default NavBarControlsSection;
