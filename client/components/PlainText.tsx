import { css } from '@rocket.chat/css-in-js';
import { Box, BoxProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const createStyles = (colors: {
	textColor: string;
	linkColor: string;
	hoverColor: string;
	disabledColor: string;
}): ReturnType<typeof css> => css`
	color: ${ colors.textColor };
	font-weight: 400;

	strong {
		font: inherit;
		font-weight: 600;
	}

	em {
		font: inherit;
		font-style: italic;
	}

	a, button {
		font: inherit;
		font-weight: 500;
		display: inline;
		appearance: none;
		background: none;
	}

	a:link, a:visited, button {
		color: ${ colors.linkColor };
		text-decoration-line: underline;
		text-underline-offset: 0.125em;
		outline-offset: 0.125em;
		cursor: pointer;
	}

	a:hover, a:active, button:hover, button:active {
		color: ${ colors.hoverColor };
	}

	*:focus {
		outline: 2px solid ${ colors.hoverColor } !important;
	}

	a, button:disabled {
		color: ${ colors.disabledColor };
		cursor: disabled;
	}

	@supports selector(:focus-visible) {
		*:focus {
			outline: 0 !important;
		}

		*:focus-visible {
			outline: 2px solid ${ colors.hoverColor } !important;
		}
	}
`;

const styles = {
	neutral: createStyles({
		textColor: '#2f343d',
		linkColor: '#2f343d',
		hoverColor: '#9ea2a8',
		disabledColor: '#eeeff1',
	}),
	info: createStyles({
		textColor: '#095ad2',
		linkColor: '#095ad2',
		hoverColor: '#10529e',
		disabledColor: '#76b7fc',
	}),
	success: createStyles({
		textColor: '#158d65',
		linkColor: '#158d65',
		hoverColor: '#106d4f',
		disabledColor: '#2de0a5',
	}),
	warning: createStyles({
		textColor: '#8e6300',
		linkColor: '#8e6300',
		hoverColor: '#b68d00',
		disabledColor: '#f3be08',
	}),
	danger: createStyles({
		textColor: '#db0c27',
		linkColor: '#db0c27',
		hoverColor: '#b30a20',
		disabledColor: '#f98f9d',
	}),
} as const;

type PlainTextProps = {
	type?: keyof typeof styles;
} & Omit<BoxProps, 'type'>;

const PlainText: FC<PlainTextProps> = ({ type = 'neutral', className, ...props }) => (
	<Box
		is='span'
		className={className
			? ([styles[type]] as (string | ReturnType<typeof css>)[]).concat(className)
			: styles[type]}
		fontFamily='sans'
		{...props}
	/>
);

export default PlainText;
