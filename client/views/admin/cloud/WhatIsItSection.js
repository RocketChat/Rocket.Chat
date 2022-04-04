import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import Subtitle from '../../../components/Subtitle';
import { useTranslation } from '../../../contexts/TranslationContext';

function WhatIsItSection(props) {
	const t = useTranslation();

	return (
		<Box is='section' {...props}>
			<Subtitle>{t('Cloud_what_is_it')}</Subtitle>

			<Box withRichContent color='neutral-800'>
				<p>{t('Cloud_what_is_it_description')}</p>

				<details>
					<p>{t('Cloud_what_is_it_services_like')}</p>

					<ul>
						<li>{t('Register_Server_Registered_Push_Notifications')}</li>
						<li>{t('Register_Server_Registered_Livechat')}</li>
						<li>{t('Register_Server_Registered_OAuth')}</li>
						<li>{t('Register_Server_Registered_Marketplace')}</li>
					</ul>

					<p>{t('Cloud_what_is_it_additional')}</p>
				</details>
			</Box>
		</Box>
	);
}

export default WhatIsItSection;
