import { Box, Button, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type AbacRoomPreviewListFooterContext = {
	loading: boolean;
	isPartial: boolean;
	canLoadMore: boolean;
	onLoadMore: () => void;
};

const AbacRoomPreviewListFooter = ({ context }: { context?: AbacRoomPreviewListFooterContext }) => {
	const { t } = useTranslation();

	if (context?.loading) {
		return (
			<Box aria-busy>
				{Array.from({ length: 3 }, (_, index) => (
					<Box key={index} display='flex' alignItems='center' paddingInline={24} paddingBlock={8}>
						<Skeleton variant='rect' width='x28' height='x28' flexShrink={0} />
						<Skeleton width='full' marginInlineStart={8} />
					</Box>
				))}
			</Box>
		);
	}

	if (context?.isPartial) {
		return (
			<Box paddingInline={24} paddingBlock={12}>
				<Button small secondary width='full' disabled={!context.canLoadMore} onClick={context.onLoadMore}>
					{t('Load_more')}
				</Button>
			</Box>
		);
	}

	return null;
};

export default AbacRoomPreviewListFooter;
