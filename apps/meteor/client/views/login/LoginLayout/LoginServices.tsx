import { ButtonGroup, Divider } from '@rocket.chat/fuselage';
import { useLoginServices, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactNode } from 'react';

import { LoginServicesButton } from './LoginServicesButton';

export const LoginServices = (): ReactNode => {
	const services = useLoginServices();
	const t = useTranslation();
	if (services.length === 0) {
		return null;
	}

	return (
		<>
			<ButtonGroup vertical stretch small>
				{services.map((service) => (
					<LoginServicesButton key={service.name} {...service} />
				))}
			</ButtonGroup>
			<Divider children={t('or')} />
		</>
	);
};
