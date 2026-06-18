import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { AnnouncementBanner } from '@rocket.chat/ui-client';
import { useVideoConfJoinCall } from '@rocket.chat/ui-video-conf';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../contexts/RoomContext';
import { useVideoConfList } from '../contextualBar/VideoConference/VideoConfList/useVideoConfList';

// Discussions created when adding conference participants don't carry the call's message block, so
// surface a banner pointing back to the ongoing call. We list by the discussion's own id (the list
// matches conferences whose `discussionRid` is this room) — invited users may not have access to the
// parent room the conference originated in.
const OngoingConferenceBanner = (): ReactElement | null => {
	const { t } = useTranslation();
	const room = useRoom();
	const joinCall = useVideoConfJoinCall();

	const { data } = useVideoConfList({ roomId: room._id });

	const ongoingCall = data?.videoConfs.find(
		(call) => call.discussionRid === room._id && call.status === VideoConferenceStatus.STARTED && !call.endedAt,
	);

	if (!ongoingCall) {
		return null;
	}

	return <AnnouncementBanner onClick={() => joinCall(ongoingCall._id)}>{t('Join_ongoing_call')}</AnnouncementBanner>;
};

export default OngoingConferenceBanner;
