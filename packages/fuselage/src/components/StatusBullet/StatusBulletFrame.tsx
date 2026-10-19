import statusBullet from '@rocket.chat/fuselage-tokens/dist/statusBullet.json';
import { styled, View } from '@tamagui/web';

import { toCSSColorValue } from '../../helpers/toCSSValue';
import { borderRadius, size } from '../../styleTokens';

const statusBulletColor = (status: keyof typeof statusBullet.light) =>
	toCSSColorValue(`status-bullet-${status}`, statusBullet.light[status]);

/** Styles the `svg` each status icon passes as `render`, which keeps its own attributes. */
export const StatusBulletFrame = styled(View, {
	display: 'inline-block',
	flexGrow: 0,
	flexShrink: 0,
	borderRadius: borderRadius('full'),
	backgroundSize: 'contain',
	width: size('x12'),
	height: size('x12'),

	variants: {
		small: {
			true: {
				width: size('x10'),
				height: size('x10'),
			},
		},
		status: {
			online: { fill: statusBulletColor('online') },
			away: { fill: statusBulletColor('away') },
			busy: { fill: statusBulletColor('busy') },
			disabled: { fill: statusBulletColor('disabled') },
			offline: { stroke: statusBulletColor('offline') },
			loading: { stroke: statusBulletColor('loading') },
		},
	} as const,
});
