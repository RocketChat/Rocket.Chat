import { Callout } from '@rocket.chat/fuselage';
import React from 'react';

import Page from '../../../components/Page';
import { useOmnichannelCustomFields } from '../../../contexts/OmnichannelContext/OmnichannelCustomFieldsContext';
import { useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import EditCustomFieldsPage from './EditCustomFieldsPage';

const EditCustomFieldsPageContainer = ({ reload }) => {
	const t = useTranslation();

	const id = useRouteParameter('id');
	const data = useOmnichannelCustomFields().find((customField) => customField._id === id);

	if (!data) {
		return (
			<Page>
				<Page.Header title={t('Edit_Custom_Field')} />
				<Page.ScrollableContentWithShadow>
					<Callout type='danger'>{t('Error')}</Callout>
				</Page.ScrollableContentWithShadow>
			</Page>
		);
	}

	return <EditCustomFieldsPage customField={data} id={id} reload={reload} />;
};

export default EditCustomFieldsPageContainer;
