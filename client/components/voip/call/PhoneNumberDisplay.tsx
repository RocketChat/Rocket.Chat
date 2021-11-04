import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import phoneNumberParser from './hooks/PhoneNumberParser';

export const PhoneNumberDisplay: FC<{ phoneNumber: string }> = ({ phoneNumber }) => {
	const { parsedNumber, error } = phoneNumberParser(phoneNumber);
	return (
		<Box color='surface'>
			{!error ? <Box>{parsedNumber}</Box> : <Box color='danger'>{`${error}`}</Box>}
		</Box>
	);
};
