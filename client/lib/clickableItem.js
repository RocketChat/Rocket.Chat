import React from 'react';
import { css } from '@rocket.chat/css-in-js';
import colors from '@rocket.chat/fuselage-tokens/colors';

// TODO remove border from here
export function clickableItem(WrappedComponent) {
	const clickable = css`
		cursor: pointer;
		border-bottom: 2px solid ${ colors.n300 } !important;

		&:hover,
		&:focus {
			background: ${ colors.n100 };
		}
	`;
	return (props) => <WrappedComponent className={clickable} tabIndex={0} {...props}/>;
}
