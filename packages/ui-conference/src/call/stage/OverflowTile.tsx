import { Avatar, Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { overflowTileStyles } from './stageStyles';

export type OverflowTileProps = {
	hidden: { avatarUrl?: string; displayName: string }[];
};

/** The last slot when not everyone fits: two faces and how many are behind them. */
const OverflowTile = ({ hidden }: OverflowTileProps) => {
	const { t } = useTranslation();

	return (
		<Box className={overflowTileStyles}>
			<Box display='flex' justifyContent='center' alignItems='center' flexDirection='row' gap={4}>
				{hidden.slice(0, 2).map((p, i) =>
					p.avatarUrl ? (
						<Avatar key={i} url={p.avatarUrl} size='x36' />
					) : (
						<Box
							key={i}
							display='flex'
							alignItems='center'
							justifyContent='center'
							width='x36'
							height='x36'
							borderRadius='full'
							backgroundColor='surface-hover'
							flexShrink={0}
						>
							<Icon name='user' size='x20' />
						</Box>
					),
				)}
			</Box>
			{hidden.length > 2 && (
				<Box fontScale='c2' marginBlockStart={4} color='font-secondary-info'>
					{t('Others_count', { count: hidden.length - 2 })}
				</Box>
			)}
		</Box>
	);
};

export default OverflowTile;
