import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { Page, PageContent } from '../../components/Page';

const NotAuthorizedPage = () => {
	const { t } = useTranslation();

	return (
		<Page>
			<PageContent paddingBlock={24}>
				<Box is='p' fontScale='p2' color='default'>
					{t('You_are_not_authorized_to_view_this_page')}
				</Box>
			</PageContent>
		</Page>
	);
};

export default NotAuthorizedPage;
