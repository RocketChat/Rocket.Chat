import { ButtonGroup, Button, Divider } from '@rocket.chat/fuselage';
import React from 'react';

import { useLoginServices } from './hooks/useLoginServices';

export const LoginServices = () => {
	const services = useLoginServices();

	if (services.length === 0) {
		return null;
	}

	return (
		<>
			<ButtonGroup>
				{services.map(({ service, url }) => (
					<Button type='submit' primary href={url}>
						{service}
					</Button>
				))}
			</ButtonGroup>
			<Divider />
		</>
	);
};
