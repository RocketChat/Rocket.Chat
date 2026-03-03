import GenericCard, { CARD_HEIGHT } from './GenericCard';
import CardSlotStopSharingHover from './CardSlotStopSharingHover';
import CardSlotPin from './CardSlotPin';

type StreamCardProps = {
	children: React.ReactNode;
	// displayName: string;
	own?: boolean;
	onClickFocusStream?: () => void;
	onClickStopSharing?: () => void;
	focused?: boolean;
	square?: boolean;
	autoHeight?: boolean;
	maxHeight?: number;
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
	square = false,
}: StreamCardProps) => {
	return (
		<GenericCard
			variant={own ? 'highlighted' : 'default'}
			{...(focused ? alternateSizeProps : {})}
			// title={own ? t('Your_screen') : t('Peer__displayName__screen', { displayName })}
			height={focused || autoHeight ? 'fit-content' : undefined}
			minHeight={autoHeight ? 0 : undefined}
			width={square ? CARD_HEIGHT : undefined}
			maxHeight={maxHeight || '100%'}
		>
			{onClickFocusStream && <CardSlotPin focused={focused} onClick={onClickFocusStream} position='bottomRight' />}
			{own && onClickStopSharing && <CardSlotStopSharingHover onClick={onClickStopSharing} />}
			{children}
		</GenericCard>
	);
};

export default StreamCard;
