import { css } from '@rocket.chat/css-in-js';
import { Box, borderRadius } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

const buttonStyles = css`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	max-width: 13.75rem;
	padding: 0.25rem 0.75rem;
	border: none;
	border-radius: ${borderRadius('full')};
	/* Palette carries no button colours: these are the tokens fuselage's success button is drawn with. */
	background-color: var(--rcx-color-button-background-success-default);
	color: var(--rcx-color-button-font-on-success);
	cursor: pointer;

	&:hover,
	&:focus-visible {
		background-color: var(--rcx-color-button-background-success-hover);
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
		<Box is='button' type='button' ref={ref} className={[buttonStyles, className]} fontScale='c1' {...props}>
			{children}
		</Box>
	);
});

export default RaisedHandsButton;
