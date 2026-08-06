import SidebarCard from './SidebarCard';
import OngoingCalls from '../../components/OngoingCalls/OngoingCalls';
import { useOngoingCalls } from '../../components/OngoingCalls/useOngoingCalls';

/**
 * The calls this user can walk into, docked at the top of the sidebar.
 *
 * The list itself is shared with the navbar button that stands in for this when the sidebar isn't showing — this
 * only gives it the sidebar's surface, and knows when there is nothing to give it at all.
 */
const OngoingCallsSection = () => {
	const { ringing, ongoing } = useOngoingCalls();

	if (ringing.length === 0 && ongoing.length === 0) {
		return null;
	}

	return (
		<SidebarCard>
			<OngoingCalls />
		</SidebarCard>
	);
};

export default OngoingCallsSection;
