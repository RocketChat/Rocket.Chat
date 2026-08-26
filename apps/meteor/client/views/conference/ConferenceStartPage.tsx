import { useTranslation } from 'react-i18next';

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

	const { t } = useTranslation();
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
			// Nothing exists yet, so this screen starts the call rather than joining one.
			action='start'
			isDirect={isDirect}
			canName={!isDirect}
			// A conference is named after the room it happens in, said as the meeting it is — and the creator can
			// put anything they like over it.
			defaultName={isDirect ? undefined : t('Meeting_in__roomName__', { roomName: name })}
			capabilities={capabilities}
			// Confirming here is what creates the call, so this is the one screen whose answer about ringing can
			// still be acted on. Only offered where a ring is possible at all: a channel or a team announces a call
			// rather than ringing it, so there would be nothing for the switch to change.
			canChooseRinging={isDirect}
			onConfirm={(preferences, chosenName, ring) => start({ state: preferences, name: chosenName, ring })}
			onCancel={closeCallWindow}
		/>
	);
};

export default ConferenceStartPage;
