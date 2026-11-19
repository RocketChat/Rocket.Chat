import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const badgeStyles = css`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.75rem;
	height: 1.75rem;
	border-radius: 50%;
	background-color: ${Palette.surface['surface-overlay'].toString()};
	color: ${Palette.text['font-pure-white'].toString()};
`;

export type TileBadgeProps = Pick<ComponentProps<typeof Box>, 'className' | 'title' | 'aria-hidden' | 'children'>;

/** A round badge in a corner of a tile. */
const TileBadge = ({ className, ...props }: TileBadgeProps) => <Box className={[badgeStyles, className].flat()} {...props} />;

export default TileBadge;
