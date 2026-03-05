import CardSlotPin from './CardSlotPin';
import CardSlotStopSharing from './CardSlotStopSharing';
import GenericCard from './GenericCard';

type StreamCardProps = {
	children: React.ReactNode;
	own?: boolean;
	onClickFocusStream?: () => void;
	onClickStopSharing?: () => void;
	focused?: boolean;
	autoHeight?: boolean;
	maxHeight?: number;
};

const alternateSizeProps = {
	maxWidth: '100%',
	maxHeight: '100%',
	height: undefined,
	width: undefined,
};

const StreamCard = ({ children, own, onClickFocusStream, onClickStopSharing, focused, autoHeight, maxHeight }: StreamCardProps) => {
	return (
		<GenericCard
			variant={own ? 'highlighted' : 'default'}
			{...(focused ? alternateSizeProps : {})}
			height={focused || autoHeight ? 'fit-content' : undefined}
			minHeight={autoHeight ? 0 : undefined}
			maxHeight={maxHeight || '100%'}
		>
			{onClickFocusStream && <CardSlotPin focused={focused} onClick={onClickFocusStream} position='bottomRight' />}
			{own && onClickStopSharing && <CardSlotStopSharing onClick={onClickStopSharing} />}
			{children}
		</GenericCard>
	);
};

export default StreamCard;
