import { Avatar, Box, Icon, Palette } from '@rocket.chat/fuselage';

import { overflowTileStyles } from './stageStyles';

export type OverflowTileProps = {
	hidden: { avatarUrl?: string; displayName: string }[];
};

/** The last slot when not everyone fits: two faces and how many are behind them. */
const OverflowTile = ({ hidden }: OverflowTileProps) => (
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
						style={{
							width: 36,
							height: 36,
							borderRadius: '50%',
							backgroundColor: Palette.surface['surface-hover'].toString(),
							flexShrink: 0,
						}}
					>
						<Icon name='user' size='x20' />
					</Box>
				),
			)}
		</Box>
		{hidden.length > 2 && (
			<Box fontSize={13} fontWeight={600} lineHeight={1} marginBlockStart={2} color='font-secondary-info'>
				{hidden.length} others
			</Box>
		)}
	</Box>
);

export default OverflowTile;
