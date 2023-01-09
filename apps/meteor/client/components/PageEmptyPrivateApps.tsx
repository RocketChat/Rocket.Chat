import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesSuggestion } from '@rocket.chat/fuselage';
import { Link } from '@rocket.chat/layout';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

function PageEmptyPrivateApps() {
	const t = useTranslation();

	return (
		<>
			<States>
				<StatesIcon name='cube' />
				<StatesTitle>{t('No private apps installed')}</StatesTitle>
				<StatesSubtitle>{t('Private apps are side-loaded and are not available on the Marketplace.')}</StatesSubtitle>
				<StatesSuggestion>
					<Link href='#'>{t('Learn_more')}</Link>
				</StatesSuggestion>
			</States>
		</>
	);
}

export default PageEmptyPrivateApps;
