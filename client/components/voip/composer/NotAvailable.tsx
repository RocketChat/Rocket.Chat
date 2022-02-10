import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

type NotAvailablePropsType = {
	children: ReactElement;
};

const NotAvailable = (props: NotAvailablePropsType): ReactElement => <Box w='full' h='full' backgroundColor='neutral-100' {...props} />;

export default NotAvailable;
