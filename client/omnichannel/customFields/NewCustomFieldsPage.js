import React, { useCallback, useMemo, useRef } from 'react';
import { Box, Button, Icon, ButtonGroup, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import CustomFieldsForm from './CustomFieldsForm';
import Page from '../../components/basic/Page';
import { getCustomFormTemplate } from '../../../app/livechat/client/views/app/customTemplates/register';
import { useTranslation } from '../../contexts/TranslationContext';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useMethod } from '../../contexts/ServerContext';
import { useRoute } from '../../contexts/RouterContext';
import { useForm } from '../../hooks/useForm';

const initialValues = {
	field: '',
	label: '',
	scope: 'visitor',
	visibility: true,
	regexp: '',
};

const additionalFieldsData = () => ({
	type: 'input',
	required: false,
	defaultValue: '',
	options: [],
	public: true,
});

const getInitialValues = (additionalForm) => ({ ...initialValues, ...additionalForm && additionalFieldsData() });

const getTemplate = () => getCustomFormTemplate('livechatCustomFieldsAdditionalForm');

const NewCustomFieldsPage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const additionalForm = useReactiveValue(getTemplate);

	const router = useRoute('omnichannel-customfields');

	const handleReturn = useCallback(() => {
		router.push({});
	}, [router]);

	const { values, handlers } = useForm(getInitialValues(additionalForm));

	console.log(values, handlers);

	const save = useMethod('livechat:saveCustomField');

	const handleSave = useMutableCallback(async () => {
		try {
			await save(undefined, {
				...values,
				visibility: values.visibility ? 'visible' : 'hidden',
			});

			dispatchToastMessage({ type: 'success', message: t('Saved') });
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return <Page>
		<Page.Header title={t('New_Custom_Field')}>
			<Button onClick={handleReturn}><Icon size='x16' name='back'/>{t('Back')}</Button>
			<Button onClick={handleSave}>{t('Save')}</Button>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<Box maxWidth='x600' w='full' alignSelf='center'>
				<CustomFieldsForm values={values} handlers={handlers}/>
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default NewCustomFieldsPage;
