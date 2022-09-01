import { ButtonGroup, Divider } from '@rocket.chat/fuselage';
import { useLoginServices } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import ServicesButton from './ServicesButton';

const Services = (): ReactElement | null => {
	const services = useLoginServices();
	const { t } = useTranslation();
	if (services.length === 0) {
		return null;
	}

	return (
		<>
			<ButtonGroup vertical stretch small>
				{services.map((service) => (
					<ServicesButton key={service.service} {...service} />
				))}
			</ButtonGroup>
			<Divider children={t('registration.component.form.divider')} />
		</>
	);
};
export default Services;
