import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

type NotAvailableProps = {
	children: ReactElement;
};

const NotAvailableContentWrapper = (props: NotAvailableProps): ReactElement => (
	<Box w='full' h='full' backgroundColor='neutral-100' {...props} />
);

export default NotAvailableContentWrapper;
