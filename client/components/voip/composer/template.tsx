import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import NotAvailable from '.';

const NotAvailableOnCall = (): ReactElement => (
	<Box h='44px' w='100%' borderColor='disabled' borderWidth='2px'>
		<NotAvailable>
			<NotAvailable.Content icon='message' text='Messages are not available on phone calls' />
		</NotAvailable>
	</Box>
);

export default NotAvailableOnCall;
