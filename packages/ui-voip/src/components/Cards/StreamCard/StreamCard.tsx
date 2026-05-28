import type { ReactNode } from 'react';

import Card from '../Card';
import StreamCardOpenInRoomButton from './StreamCardOpenInRoom';
import StreamCardPin from './StreamCardPin';
import StreamCardStopSharingButton from './StreamCardStopSharingButton';

type StreamCardProps = {
	children: ReactNode;
	own?: boolean;
	onClickFocusStream?: () => void;
	onClickStopSharing?: () => void;
	onClickOpenInRoom?: () => void;
	focused?: boolean;
	autoHeight?: boolean;
	maxHeight?: number;
	showStopSharingOnHover?: boolean;
};

const alternateSizeProps = {
	maxWidth: '100%',
	maxHeight: '100%',
	height: undefined,
	width: undefined,
};

const StreamCard = ({
	children,
	own,
	onClickFocusStream,
	onClickStopSharing,
	onClickOpenInRoom,
	focused,
	autoHeight,
	maxHeight,
	showStopSharingOnHover = false,
}: StreamCardProps) => {
	return (
		<Card
			variant={own ? 'highlighted' : 'default'}
			{...(focused ? alternateSizeProps : {})}
			height={focused || autoHeight ? 'fit-content' : undefined}
			minHeight={autoHeight ? 0 : undefined}
			maxHeight={maxHeight || '100%'}
		>
			{onClickFocusStream && <StreamCardPin focused={focused} onClick={onClickFocusStream} position='bottomRight' />}
			{own && onClickStopSharing && <StreamCardStopSharingButton onClick={onClickStopSharing} showOnHover={showStopSharingOnHover} />}
			{onClickOpenInRoom && <StreamCardOpenInRoomButton onClick={onClickOpenInRoom} showOnHover={true} />}
			{children}
		</Card>
	);
};

export default StreamCard;
