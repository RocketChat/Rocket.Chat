import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { AnnouncementBanner } from '@rocket.chat/ui-client';
import { useVideoConfJoinCall } from '@rocket.chat/ui-video-conf';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../contexts/RoomContext';
import { useVideoConfList } from '../contextualBar/VideoConference/VideoConfList/useVideoConfList';

/**
 * A way into the call a discussion was opened for.
 *
 * Someone added to a call mid-way is put in the chat that call moved to, and that chat carries none of the
 * call's own message — so without this the only way back to the call they were added to is the room's call
 * history, which is a list of calls rather than an invitation to one.
 *
 * Listed by the discussion's own id: the conference is matched on the room its chat lives in as readily as on
 * the room it started in, which is the only reason this works for someone who cannot see the parent room.
 */
const OngoingConferenceBanner = () => {
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
