import { css } from '@rocket.chat/css-in-js';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React from 'react';

// TODO remove border from here
export function clickableItem(Component) {
	const clickable = css`
		cursor: pointer;
		&:hover,
		&:focus {
			background: ${colors.n100};
		}
		border-bottom: 2px solid ${colors.n300} !important;
	`;
	const WrappedComponent = (props) => <Component className={clickable} tabIndex={0} {...props} />;

	WrappedComponent.displayName = `clickableItem(${Component.displayName ?? Component.name ?? 'Component'})`;

	return WrappedComponent;
}
