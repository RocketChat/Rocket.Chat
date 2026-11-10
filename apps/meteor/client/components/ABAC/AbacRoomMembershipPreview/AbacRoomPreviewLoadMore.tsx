import { Box, Button } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type AbacRoomPreviewLoadMoreContext = {
	canLoadMore: boolean;
	onLoadMore: () => void;
};

const AbacRoomPreviewLoadMore = ({ context }: { context?: AbacRoomPreviewLoadMoreContext }) => {
	const { t } = useTranslation();

	return (
		<Box paddingInline={24} paddingBlock={12} display='flex' flexDirection='column'>
			<Button size='small' variant='secondary' disabled={!context?.canLoadMore} onClick={context?.onLoadMore}>
				{t('Load_more')}
			</Button>
		</Box>
	);
};

export default AbacRoomPreviewLoadMore;
