import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type TileBadgeProps = Pick<ComponentProps<typeof Box>, 'className' | 'title' | 'aria-hidden' | 'children'>;

/** A round badge in a corner of a tile. */
const TileBadge = (props: TileBadgeProps) => (
	<Box
		display='flex'
		alignItems='center'
		justifyContent='center'
		width='x28'
		height='x28'
		borderRadius='full'
		backgroundColor='surface-overlay'
		color='pure-white'
		{...props}
	/>
);

export default TileBadge;
