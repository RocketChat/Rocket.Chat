import { ConferenceNotStarted, ConferencePreflight, ConferenceStatePage } from '@rocket.chat/ui-conference';
import type { VideoConferenceInfo } from '@rocket.chat/ui-video-conf';
import { useTranslation } from 'react-i18next';

import { useConfinedNavigation } from './hooks/useConfinedNavigation';
import { usePersistentConference } from './hooks/usePersistentConference';
import { closeCallWindow } from './lib/callWindow';
import { conferencePreflightMedia } from './lib/conferencePreflightMedia';

export type PersistentConferencePageProps = {
	link: VideoConferenceInfo;
	segment: string;
	onStarted: (callId: string) => void;
};

/**
 * A conference link with nothing live: the preflight to start its conference for someone who may, and the
 * "not started yet" page for everyone else.
 */
const PersistentConferencePage = ({ link, segment, onStarted }: PersistentConferencePageProps) => {
	useConfinedNavigation();

	const { t } = useTranslation();
	const { title, canStart, canRing, capabilities, starting, error, reason, start, reset } = usePersistentConference(
		link,
		segment,
		onStarted,
	);

	if (error && reason) {
		return (
			<ConferenceStatePage
				icon='warning'
				title={t('Something_went_wrong')}
				subtitle={t(reason)}
				action={{ label: t('Close'), onClick: closeCallWindow }}
			/>
		);
	}

	if (error) {
		return <ConferenceStatePage icon='warning' title={t('Something_went_wrong')} action={{ label: t('Retry'), onClick: reset }} />;
	}

	if (!canStart) {
		return <ConferenceNotStarted title={title} onClose={closeCallWindow} />;
	}

	return (
		<ConferencePreflight
			name={title}
			action='start'
			isDirect={false}
			canName={false}
			nameReadOnly
			capabilities={capabilities}
			media={conferencePreflightMedia}
			canChooseRinging={canRing}
			confirming={starting}
			onConfirm={(preferences, _name, ring) => start({ state: preferences, ring })}
			onCancel={closeCallWindow}
		/>
	);
};

export default PersistentConferencePage;
