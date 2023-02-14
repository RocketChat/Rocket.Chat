import type { FC } from 'react';
import React from 'react';

import './style.css';

// TODO: Replace with a component from @rocket.chat/fuselage
const ModalSeparator: FC<{ text: string }> = ({ text, ...props }) => (
	<h6 className='modal-separator' {...props}>
		{text}
	</h6>
);

export default ModalSeparator;
