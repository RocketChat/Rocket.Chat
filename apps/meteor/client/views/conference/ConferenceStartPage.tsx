import ConferencePageError from './ConferencePageError';
import ConferencePreflight from './ConferencePreflight';
import { useConfinedNavigation } from './hooks/useConfinedNavigation';
import { useStartConference } from './hooks/useStartConference';
import { closeCallWindow } from './lib/callWindow';
import PageLoading from '../root/PageLoading';

type ConferenceStartPageProps = {
	rid: string;
};

/**
 * The call window before there is a call: the preflight for a conference this user is about to start.
 *
 * Clicking *call* in a room opens this window and nothing else. Creating the conference posts a message in the
 * room, rings people and writes a call into everyone's history, none of which should happen for a call the user
 * may still walk away from — so it waits for them to confirm here, and cancelling leaves no trace at all.
 */
const ConferenceStartPage = ({ rid }: ConferenceStartPageProps) => {
	// The preflight is the whole page, but the window is still the call's: a stray link must not navigate it.
	useConfinedNavigation();

	const { name, isDirect, capabilities, loading, error, start } = useStartConference(rid);

	if (error) {
		return <ConferencePageError />;
	}

	if (loading) {
		return <PageLoading />;
	}

	return (
		<ConferencePreflight
			name={name}
			// A direct call is placed to someone, so confirming calls them by name. A group conference is simply
			// started, and can be named on the way in.
			confirm={isDirect ? 'call' : 'start'}
			canName={!isDirect}
			capabilities={capabilities}
			onConfirm={(preferences, chosenName) => start({ state: preferences, name: chosenName })}
			onCancel={closeCallWindow}
		/>
	);
};

export default ConferenceStartPage;
