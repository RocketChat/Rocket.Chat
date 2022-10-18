import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Subtitle from '../../../components/Subtitle';

function WhatIsItSection(props) {
	const t = useTranslation();

	return (
		<Box is='section' {...props}>
			<Subtitle>{t('Cloud_what_is_it')}</Subtitle>

			<Box withRichContent color='default'>
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
