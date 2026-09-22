import { OngoingCallsDropdown } from '@rocket.chat/ui-conference';

import OngoingCallsProvider from '../views/conference/providers/OngoingCallsProvider';

/**
 * The navbar's way in to the calls running now.
 *
 * The button and its list are the package's; what they show, and what clicking anything in them does, is this
 * workspace's — which is the whole of what is left here. The dropdown renders nothing while there is nothing to
 * join, so mounting this costs the navbar no space.
 */
const NavBarItemOngoingCalls = () => (
	<OngoingCallsProvider>
		<OngoingCallsDropdown />
	</OngoingCallsProvider>
);

export default NavBarItemOngoingCalls;
