import React, { FC } from 'react';

import Section from './Section';

const Avatar: FC = ({ children }) => (
	<Section display='flex' justifyContent='center'>
		{children}
	</Section>
);

export default Avatar;
