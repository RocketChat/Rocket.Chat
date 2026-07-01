import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef, ForwardedRef } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

// AI accent purple. Not part of the Fuselage palette today, so it is defined here as the dedicated
// brand accent for the Intelligent Search affordance.
const AI_ACCENT = '#534ab7';
const AI_ACCENT_HOVER = '#463da0';

type NavBarSearchAIButtonProps = {
	active: boolean;
} & ComponentPropsWithoutRef<typeof Box>;

const NavBarSearchAIButton = forwardRef(function NavBarSearchAIButton(
	{ active, ...props }: NavBarSearchAIButtonProps,
	ref: ForwardedRef<HTMLElement>,
) {
	const { t } = useTranslation();

	const buttonClassName = css`
		display: inline-flex;
		align-items: center;
		height: 20px;
		border: none;
		border-radius: 20px;
		cursor: pointer;
		white-space: nowrap;
		font-family: inherit;
		font-size: 12px;
		font-weight: 500;
		line-height: 1;
		background-color: ${active ? AI_ACCENT : 'transparent'};
		color: ${active ? '#ffffff' : 'var(--rcx-color-font-hint, #9ca2a8)'};
		padding-inline: ${active ? '8px 10px' : '8px'};
		gap: ${active ? '5px' : '0'};
		transition:
			background-color 160ms ease,
			color 160ms ease,
			padding 200ms ease,
			gap 200ms ease;

		&:hover {
			background-color: ${active ? AI_ACCENT_HOVER : 'var(--rcx-color-surface-hover, rgba(0, 0, 0, 0.06))'};
		}

		&:focus-visible {
			outline: 2px solid ${AI_ACCENT};
			outline-offset: 1px;
		}
	`;

	const labelClassName = css`
		overflow: hidden;
		max-width: ${active ? '40px' : '0'};
		opacity: ${active ? '1' : '0'};
		transition:
			max-width 200ms ease,
			opacity 160ms ease;
	`;

	return (
		<Box is='button' type='button' aria-pressed={active} className={buttonClassName} ref={ref} {...props}>
			<Icon name='stars' size='x16' />
			<Box is='span' className={labelClassName}>
				{t('AI')}
			</Box>
		</Box>
	);
});

export default NavBarSearchAIButton;
