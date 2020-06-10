import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React, { useState } from 'react';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useLoggedInCloud } from './hooks/useLoggedInCloud';
import AppsTable from './AppsTable';

function AppsPage() {
	const t = useTranslation();
	const [modal, setModal] = useState(null);

	const markeplaceRouter = useRoute('admin-markeplace');

	const isLoggedIn = useLoggedInCloud();

	return <><Page flexDirection='column'>
		<Page.Header title={t('Marketplace')}>
			{!isLoggedIn && <ButtonGroup>
				<Button primary onClick={() => { markeplaceRouter.push({}); }}>
					<Icon name='download'/> {t('View_Markeplace')}
				</Button>
			</ButtonGroup>}
		</Page.Header>
		<Page.Content>
			<AppsTable setModal={setModal}/>
		</Page.Content>
	</Page>{ modal }</>;
}

export default AppsPage;
