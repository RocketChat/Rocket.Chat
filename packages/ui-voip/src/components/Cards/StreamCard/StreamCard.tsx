import type { ReactNode } from 'react';

import Card from '../Card';
import StreamCardPin from './StreamCardPin';
import StreamCardStopSharingButton from './StreamCardStopSharingButton';

type StreamCardProps = {
	children: ReactNode;
	own?: boolean;
	onClickFocusStream?: () => void;
	onClickStopSharing?: () => void;
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
			{children}
		</Card>
	);
};

export default StreamCard;
