import type { VideoConference } from '@rocket.chat/core-typings';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { VideoConfPopupInfo } from '@rocket.chat/ui-video-conf';

import ReactiveUserStatus from '../../../../../../components/UserStatus/ReactiveUserStatus';

export type VideoConfPopupCallerInfoProps = {
	caller: VideoConference['createdBy'];
	/** Only group conferences carry a title. */
	title?: string;
};

/**
 * Describes a conference to someone who cannot see the room it belongs to — membership grants no room access,
 * so there is no local room or subscription to take a name and avatar from. Whoever started the call is the
 * identity such a member does have, and it is the one that matters on an incoming call.
 */
const VideoConfPopupCallerInfo = ({ caller, title }: VideoConfPopupCallerInfoProps) => {
	const callerName = useUserDisplayName(caller);

	return (
		<VideoConfPopupInfo avatar={<UserAvatar username={caller.username} size='x40' />} icon={<ReactiveUserStatus uid={caller._id} />}>
			{title || callerName}
		</VideoConfPopupInfo>
	);
};

export default VideoConfPopupCallerInfo;
