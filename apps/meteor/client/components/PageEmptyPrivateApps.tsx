import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesSuggestion } from '@rocket.chat/fuselage';
import { Link } from '@rocket.chat/layout';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

const PageEmptyPrivateApps = () => {
	const t = useTranslation();

	return (
		<>
			<States>
				<StatesIcon name='cube' />
				<StatesTitle>{t('No_private_apps_installed')}</StatesTitle>
				<StatesSubtitle>{t('Private_apps_are_side-loaded')}</StatesSubtitle>
				<StatesSuggestion>
					{/* TODO: update documentation link */}
					<Link href='#'>{t('Learn_more')}</Link>
				</StatesSuggestion>
			</States>
		</>
	);
};

export default PageEmptyPrivateApps;
