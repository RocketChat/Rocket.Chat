import { Box, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import GenericCard, { CARD_HEIGHT } from './GenericCard';

type StreamCardProps = {
	children: React.ReactNode;
	displayName: string;
	own?: boolean;
	onClickFocusStream?: () => void;
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
	displayName,
	onClickFocusStream,
	focused,
	autoHeight,
	maxHeight,
	square = false,
}: StreamCardProps) => {
	const { t } = useTranslation();
	return (
		<GenericCard
			{...(focused ? alternateSizeProps : {})}
			title={own ? t('Your_screen') : t('Peer__displayName__screen', { displayName })}
			height={focused || autoHeight ? 'fit-content' : undefined}
			minHeight={autoHeight ? 0 : undefined}
			width={square ? CARD_HEIGHT : undefined}
			maxHeight={maxHeight || '100%'}
			slots={{
				bottomLeft: (
					<Box fontScale='c2' color='default'>
						{displayName}
					</Box>
				),
				bottomRight: onClickFocusStream ? (
					<IconButton
						mb={-4}
						mi={-8} // TODO: this should not have negative margins, SlotContainer needs to be updated for special cases like this.
						tiny
						secondary={false}
						icon='pin'
						onClick={onClickFocusStream}
						title={focused ? t('Unpin') : t('Pin')}
					/>
				) : null,
				// bottomRight: onClickFullScreen ? (
				//	<IconButton tiny secondary={false} icon={focused ? 'arrow-collapse' : 'arrow-expand'} onClick={onClickFullScreen} />
				// ) : null, // TODO: Add full screen button
			}}
		>
			{children}
		</GenericCard>
	);
};

export default StreamCard;
