import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { isIterable } from './isIterable';

function Message({ className, ...props }) {
	return (
		<Box
			rcx-message
			pi='x20'
			pb='x16'
			pbs='x16'
			display='flex'
			{...props}
			className={[...(isIterable(className) ? className : [className])].filter(Boolean)}
		/>
	);
}

export default Message;
