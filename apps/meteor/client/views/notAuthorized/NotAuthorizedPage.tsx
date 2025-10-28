import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { Page, PageContent } from '../../components/Page';

const NotAuthorizedPage = (): ReactElement => {
	const { t } = useTranslation();

	return (
		<Page>
			<PageContent pb={24}>
				<Box is='p' fontScale='p2' color='default'>
					{t('You_are_not_authorized_to_view_this_page')}
				</Box>
			</PageContent>
		</Page>
	);
};

export default NotAuthorizedPage;
