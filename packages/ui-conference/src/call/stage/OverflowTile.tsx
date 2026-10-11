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
					// Named, since this is the only place these people appear on the stage.
					p.avatarUrl ? (
						<Avatar key={i} url={p.avatarUrl} size='x36' alt={p.displayName} title={p.displayName} />
					) : (
						<Box
							key={i}
							role='img'
							aria-label={p.displayName}
							title={p.displayName}
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
