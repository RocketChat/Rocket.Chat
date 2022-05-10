import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import Page from '../../components/Page';
import { useTranslation } from '../../contexts/TranslationContext';

const NotAuthorizedPage = (): ReactElement => {
	const t = useTranslation();

	return (
		<Page>
			<Page.Content pb='x24'>
				<Box is='p' fontScale='p2'>
					{t('You_are_not_authorized_to_view_this_page')}
				</Box>
			</Page.Content>
		</Page>
	);
};

export default NotAuthorizedPage;
