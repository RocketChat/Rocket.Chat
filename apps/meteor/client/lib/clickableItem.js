import { css } from '@rocket.chat/css-in-js';
import { Palette } from '@rocket.chat/fuselage';
import React from 'react';

// TODO remove border from here
export function clickableItem(Component) {
	const clickable = css`
		cursor: pointer;
		&:hover,
		&:focus {
			background: ${Palette.surface['surface-hover']};
		}
		border-bottom: 2px solid ${Palette.stroke['stroke-extra-light']} !important;
	`;
	const WrappedComponent = (props) => <Component className={clickable} tabIndex={0} {...props} />;

	WrappedComponent.displayName = `clickableItem(${Component.displayName ?? Component.name ?? 'Component'})`;

	return WrappedComponent;
}
