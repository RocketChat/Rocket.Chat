import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, IconButton, Palette, Throbber } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const tileStyles = css`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.25rem;
	width: 100%;
	aspect-ratio: 16 / 9;
	padding: 0;
	overflow: hidden;
	border: 2px solid transparent;
	border-radius: 0.5rem;
	background-color: ${Palette.surface['surface-tint'].toString()};
	color: ${Palette.text['font-secondary-info'].toString()};
	font: inherit;
	cursor: pointer;

	&:hover:not(:disabled) {
		background-color: ${Palette.surface['surface-hover'].toString()};
	}

	&:focus-visible {
		outline: 2px solid ${Palette.stroke['stroke-highlight'].toString()};
		outline-offset: 2px;
	}

	&:disabled {
		cursor: default;
	}

	&[aria-pressed='true'] {
		border-color: ${Palette.stroke['stroke-highlight'].toString()};
	}
`;

// Readable over a picture as well as over the bare tile.
const captionStyles = css`
	position: relative;
	padding-inline: 0.375rem;
	border-radius: 0.25rem;
	background-color: ${Palette.surface['surface-light'].toString()};
	color: ${Palette.text['font-default'].toString()};
`;

const overlayStyles = css`
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(0, 0, 0, 0.4);
	color: ${Palette.text['font-pure-white'].toString()};
`;

const badgeStyles = css`
	position: absolute;
	inset-block-end: 0.25rem;
	inset-inline-end: 0.25rem;
	display: flex;
	border-radius: 50%;
	background-color: ${Palette.stroke['stroke-highlight'].toString()};
	color: ${Palette.text['font-pure-white'].toString()};
`;

const removeStyles = css`
	position: absolute;
	inset-block-start: 0.25rem;
	inset-inline-end: 0.25rem;
`;

export type BackgroundTileProps = {
	/** The tile's name, read out and, with `caption`, shown on it. */
	label: string;
	/** Whether it is the background in use; left out for a tile that does something rather than being a background. */
	selected?: boolean;
	/** On its way to the camera. */
	applying?: boolean;
	disabled?: boolean;
	onClick: () => void;
	/** Offered only for a background the reader can take away, named by `removeLabel`. */
	onRemove?: () => void;
	removeLabel?: string;
	/** Shows `label` under `children`, for a tile whose picture does not say what it is. */
	caption?: boolean;
	children: ReactNode;
};

const BackgroundTile = ({
	label,
	selected,
	applying = false,
	disabled = false,
	onClick,
	onRemove,
	removeLabel,
	caption = false,
	children,
}: BackgroundTileProps) => (
	<Box position='relative'>
		<Box
			is='button'
			type='button'
			className={tileStyles}
			aria-label={label}
			aria-pressed={selected}
			aria-busy={applying || undefined}
			disabled={disabled}
			onClick={onClick}
		>
			{children}
			{caption && (
				<Box is='span' fontScale='c2' className={captionStyles} aria-hidden>
					{label}
				</Box>
			)}
			{applying && (
				<Box is='span' className={overlayStyles}>
					<Throbber size='x8' inheritColor />
				</Box>
			)}
			{selected && !applying && (
				<Box is='span' className={badgeStyles}>
					<Icon name='check' size='x16' />
				</Box>
			)}
		</Box>
		{onRemove && (
			<Box className={removeStyles}>
				<IconButton
					icon='cross'
					size='mini'
					variant='secondary'
					aria-label={removeLabel}
					title={removeLabel}
					disabled={disabled}
					onClick={onRemove}
				/>
			</Box>
		)}
	</Box>
);

export default BackgroundTile;
