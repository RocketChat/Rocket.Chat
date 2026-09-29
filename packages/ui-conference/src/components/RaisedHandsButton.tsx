import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

const buttonStyles = css`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	max-width: 220px;
	padding: 4px 10px;
	border: none;
	border-radius: 16px;
	background-color: var(--rcx-color-button-background-success-default, #148660);
	color: #fff;
	font-size: 12px;
	line-height: 16px;
	font-weight: 500;
	cursor: pointer;

	&:hover,
	&:focus-visible {
		background-color: var(--rcx-color-button-background-success-hover, #106d4f);
	}
`;

/** What GenericMenu stamps onto the trigger it clones: `small` and `icon` do not belong on a label, and are dropped. */
export type RaisedHandsButtonProps = Omit<ComponentProps<typeof Box>, 'is' | 'className'> & {
	small?: boolean;
	icon?: unknown;
	className?: string;
};

const RaisedHandsButton = forwardRef<HTMLButtonElement, RaisedHandsButtonProps>(function RaisedHandsButton(
	{ small: _small, icon: _icon, className, children, ...props },
	ref,
) {
	// Spread because GenericMenu clones this trigger with the props that open the menu; its class joins the pill's.
	return (
		<Box is='button' type='button' ref={ref} className={[buttonStyles, className]} {...props}>
			{children}
		</Box>
	);
});

export default RaisedHandsButton;
