import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import ConferencePreflight from './ConferencePreflight';
import ConferenceStatePage from './ConferenceStatePage';
import { useConference } from '../context/ConferenceContext';
import type { ConferenceMember } from '../context/definitions';
import { PREFLIGHT_FACES_SHOWN } from '../lib/constants';

export type ConferenceWindowGateProps = {
	present: ConferenceMember[];
	children: ReactNode;
};

const ConferenceWindowGate = ({ present, children }: ConferenceWindowGateProps) => {
	const { room, session, call, actions, slots, viewer } = useConference();
	const { t } = useTranslation();

	// Only a refusal is an answer about the call. Anything else is the server not having been reached, which says
	// nothing about it — and sending someone away from a call that is still running is the worse mistake.
	if (room.error) {
		return room.error.kind === 'refused' ? (
			<>{slots.unauthorized}</>
		) : (
			<ConferenceStatePage
				icon='warning'
				title={t('Something_went_wrong')}
				action={{ label: t('Retry'), onClick: () => void room.retry() }}
			/>
		);
	}

	if (session.error) {
		return session.error.kind === 'refused' ? (
			<>{slots.joinRefused}</>
		) : (
			// Back to the preflight rather than straight into another attempt, with the devices they chose intact.
			<ConferenceStatePage icon='warning' title={t('Something_went_wrong')} action={{ label: t('Retry'), onClick: session.retry }} />
		);
	}

	// Waits for the room even with a session: a call started on the start screen arrives joined before its provider
	// is known, and until then an embedded call reads as a join with no URL.
	if (session.loading || room.loading) {
		return <>{slots.loading}</>;
	}

	if (call.ended && !session.joined) {
		return <ConferenceStatePage icon='phone-off' title={t('Call_ended')} action={{ label: t('Close'), onClick: actions.leave }} />;
	}

	if (!session.joined) {
		return (
			// No `confirming`: joining takes this screen down with it — `session.loading` is that very request, and
			// it returns the loading slot above — so there is no button left to report it on.
			<ConferencePreflight
				name={call.name}
				action={call.placing ? 'start' : 'join'}
				isDirect={call.canRing}
				canName={call.canRename}
				participants={{ people: present.slice(0, PREFLIGHT_FACES_SHOWN), total: present.length, displayAvatars: viewer.displayAvatars }}
				capabilities={call.capabilities}
				media={slots.preflightMedia ?? null}
				onConfirm={(preferences, name, ring) => actions.join(preferences, name, ring)}
				onCancel={actions.leave}
			/>
		);
	}

	// An embedded provider joins with no URL — it renders inside Rocket.Chat rather than at an address of its own —
	// so having none is its documented answer, not a failed join. Everything else the window offers works either
	// way; only the frame below has nothing to show.
	if (!session.url && !session.embedded) {
		return (
			<ConferenceStatePage icon='warning' title={t('error-videoconf-unexpected')} action={{ label: t('Close'), onClick: actions.leave }} />
		);
	}

	return <>{children}</>;
};

export default ConferenceWindowGate;
