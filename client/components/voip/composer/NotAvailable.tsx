import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

type NotAvailablePropsType = {
	children: ReactElement;
};

const NotAvailable = ({ children }: NotAvailablePropsType): ReactElement => (
	<Box w='full' h='full' backgroundColor='neutral-100'>
		{children}
	</Box>
);

export default NotAvailable;
