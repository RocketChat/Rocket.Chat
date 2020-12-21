import React from 'react';
import { css } from '@rocket.chat/css-in-js';

export function clickableItem(WrappedComponent) {
	const clickable = css`
		cursor: pointer;
		border-bottom: 2px solid #F2F3F5 !important;

		&:hover,
		&:focus {
			background: #F7F8FA;
		}
	`;
	return (props) => <WrappedComponent className={clickable} tabIndex={0} {...props}/>;
}
