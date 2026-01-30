import { Box } from '@rocket.chat/fuselage';
import { Page, PageContent } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

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
