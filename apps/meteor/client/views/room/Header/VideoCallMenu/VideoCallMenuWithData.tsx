import type { ConferenceLink } from './ConferenceLink';
import VideoCallMenu from './VideoCallMenu';
import type { VideoCallMenuProps } from './VideoCallMenu';
import { usePersistentConferenceRooms } from './usePersistentConferenceRooms';
import { useVideoCallMenuSections } from './useVideoCallMenuSections';
import type { UseVideoCallMenuSectionsInput } from './useVideoCallMenuSections';

export type VideoCallMenuWithDataProps = Pick<VideoCallMenuProps, 'title' | 'icon' | 'className'> &
	Omit<UseVideoCallMenuSectionsInput, 'links'>;

const NO_LINKS: readonly ConferenceLink[] = [];

const VideoCallMenuWithData = ({
	rid,
	title,
	icon,
	className,
	canStart,
	canManage,
	startDisabled,
	startDisabledReason,
	onStart,
}: VideoCallMenuWithDataProps) => {
	const { data: links = NO_LINKS } = usePersistentConferenceRooms(rid);
	const sections = useVideoCallMenuSections({ rid, links, canStart, canManage, startDisabled, startDisabledReason, onStart });

	return <VideoCallMenu sections={sections} title={title} icon={icon} className={className} />;
};

export default VideoCallMenuWithData;
