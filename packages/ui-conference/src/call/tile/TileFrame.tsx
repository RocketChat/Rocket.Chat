import { VisuallyHidden } from '@react-aria/visually-hidden';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Palette, borderRadius } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { TileParticipant } from '../lib/stageTiles';

const tileStyles = css`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	overflow: hidden;
	border-radius: ${borderRadius('large')};
	container-type: inline-size;
	color: ${Palette.text['font-pure-white'].toString()};
`;

/** The name over the tile: plain text with a shadow to keep it legible over any picture, without covering it. */
const labelStyles = css`
	position: absolute;
	left: 0.5rem;
	bottom: 0.25rem;
	padding: 0 0.5rem;
	border-radius: ${borderRadius('medium')};
	color: ${Palette.text['font-pure-white'].toString()};
	/* Fixed, not themed: it holds the name over camera frames, which are the same colours in every theme. */
	text-shadow:
		0 1px 2px rgba(0, 0, 0, 0.6),
		0 0 2px rgba(0, 0, 0, 0.3);
	max-width: calc(100% - 1rem);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	pointer-events: none;
`;

const indicatorRowStyles = css`
	position: absolute;
	top: 0.25rem;
	right: 0.25rem;
	display: flex;
	gap: 0.25rem;
	pointer-events: none;
`;

const indicatorBadgeStyles = css`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.75rem;
	height: 1.75rem;
	border-radius: 50%;
	background-color: ${Palette.surface['surface-overlay'].toString()};
	color: ${Palette.text['font-pure-white'].toString()};
`;

export type TileFrameProps = Pick<TileParticipant, 'displayName' | 'muted' | 'held'> & {
	/** The picture: their camera, or their avatar. */
	children: ReactNode;
};

/** Everything a tile says over the picture: who it is, and whether their microphone is off or they are on hold. */
const TileFrame = ({ displayName, muted, held, children }: TileFrameProps) => {
	const { t } = useTranslation();

	return (
		<Box className={tileStyles}>
			{children}
			<Box className={labelStyles} fontScale='p1'>
				{displayName}
			</Box>
			<Box className={indicatorRowStyles}>
				{muted && (
					<Box className={indicatorBadgeStyles} title={t('Microphone_muted')}>
						<Icon name='mic-off' size='x16' />
						<VisuallyHidden>{t('Microphone_muted')}</VisuallyHidden>
					</Box>
				)}
				{held && (
					<Box className={indicatorBadgeStyles} title={t('On_Hold')}>
						<Icon name='pause-shape-unfilled' size='x16' />
						<VisuallyHidden>{t('On_Hold')}</VisuallyHidden>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default TileFrame;
