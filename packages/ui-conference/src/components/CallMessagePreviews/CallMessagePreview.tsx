import { css, keyframes } from '@rocket.chat/css-in-js';
import { IconButton, Palette, Text, borderRadius, useStyle } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { HTMLAttributes, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const enter = keyframes`
	from {
		opacity: 0;
		transform: translateY(-0.5rem);
	}
`;

const previewStyles = css`
	position: relative;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 0.75rem;
	border-radius: ${borderRadius('large')};
	background-color: ${Palette.surface['surface-light'].toString()};
	box-shadow:
		0 2px 4px 0 ${Palette.shadow['shadow-elevation-2x'].toString()},
		0 8px 24px 0 ${Palette.shadow['shadow-elevation-2y'].toString()};
	pointer-events: auto;

	&:hover {
		background-color: ${Palette.surface['surface-hover'].toString()};
	}

	@media (prefers-reduced-motion: no-preference) {
		animation: ${enter} 200ms ease-out;
	}
`;

const openStyles = css`
	display: flex;
	flex: 1;
	flex-direction: column;
	min-width: 0;
	padding: 0;
	border: 0;
	background: none;
	color: inherit;
	font: inherit;
	text-align: start;
	cursor: pointer;

	&::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: ${borderRadius('large')};
	}

	&:focus-visible {
		outline: none;
	}

	&:focus-visible::after {
		box-shadow: 0 0 0 2px ${Palette.shadow['shadow-highlight'].toString()};
	}
`;

const textStyles = css`
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	overflow: hidden;
	overflow-wrap: anywhere;
`;

const dismissStyles = css`
	position: relative;
`;

export type CallMessagePreviewProps = {
	username: string;
	name: string;
	children?: ReactNode;
	onOpen: () => void;
	onDismiss: () => void;
} & Pick<HTMLAttributes<HTMLDivElement>, 'onPointerEnter' | 'onPointerLeave' | 'onFocus' | 'onBlur'>;

const CallMessagePreview = ({ username, name, children, onOpen, onDismiss, ...props }: CallMessagePreviewProps) => {
	const { t } = useTranslation();
	const previewClassName = useStyle(previewStyles);
	const openClassName = useStyle(openStyles);
	const textClassName = useStyle(textStyles);
	const dismissClassName = useStyle(dismissStyles);

	return (
		<div className={previewClassName} {...props}>
			<UserAvatar username={username} size='x36' />
			<button type='button' className={openClassName} onClick={onOpen}>
				<Text is='span' fontScale='p2b' color='titles-labels' truncate>
					{name}
				</Text>
				{children && (
					<Text is='span' fontScale='p2' color='default' className={textClassName}>
						{children}
					</Text>
				)}
			</button>
			<IconButton icon='cross' size='mini' aria-label={t('Dismiss')} className={dismissClassName} onClick={onDismiss} />
		</div>
	);
};

export default CallMessagePreview;
