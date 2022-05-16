import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { isIterable } from './isIterable';

const style = css`
	display: -webkit-box;
	overflow: hidden;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	word-break: break-word;
`;

function BodyClamp({ className, ...props }) {
	return (
		<Box
			rcx-message__body
			className={[...(isIterable(className) ? className : [className]), style].filter(Boolean)}
			flexShrink={1}
			lineHeight='1.45'
			minHeight='40px'
			{...props}
		/>
	);
}

export default BodyClamp;
