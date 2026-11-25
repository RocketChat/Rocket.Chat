import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { ConferenceStatePage, ConferenceWindow } from '@rocket.chat/ui-conference';
import { useVideoConferenceInfo } from '@rocket.chat/ui-video-conf';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import PersistentConferencePage from './PersistentConferencePage';
import { retryUnlessRefused } from './lib/retryUnlessRefused';
import ConferenceProvider from './providers/ConferenceProvider';
import { isRefusal } from '../../lib/utils/isRefusal';
import PageLoading from '../root/PageLoading';

export type ConferenceLinkGateProps = {
	/** The conference address: a call id, or a conference link. */
	segment: string;
};

/**
 * What a conference address shows, at that address: the call it names, the page of a link with nothing live, or
 * why it cannot be opened. A conference started from that page stays in this window.
 */
const ConferenceLinkGate = ({ segment }: ConferenceLinkGateProps) => {
	const { t } = useTranslation();
	const { data: info, isPending, error, refetch } = useVideoConferenceInfo(segment, { retry: retryUnlessRefused });
	const [startedCallId, setStartedCallId] = useState<string>();

	const callId = startedCallId ?? (info && info.status !== VideoConferenceStatus.NOT_STARTED ? info._id : undefined);

	if (callId) {
		return (
			<ConferenceProvider key={callId} callId={callId} initialInfo={startedCallId ? undefined : info}>
				<ConferenceWindow />
			</ConferenceProvider>
		);
	}

	if (error) {
		return isRefusal(error) ? (
			<ConferenceUnauthorizedPage />
		) : (
			<ConferenceStatePage icon='warning' title={t('Something_went_wrong')} action={{ label: t('Retry'), onClick: () => void refetch() }} />
		);
	}

	if (isPending || !info) {
		return <PageLoading />;
	}

	return <PersistentConferencePage link={info} segment={segment} onStarted={setStartedCallId} />;
};

export default ConferenceLinkGate;
