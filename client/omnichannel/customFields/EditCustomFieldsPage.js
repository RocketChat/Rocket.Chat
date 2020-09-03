import React, { useCallback, useState } from 'react';
import { Box, Button, Icon, ButtonGroup, Callout, FieldGroup } from '@rocket.chat/fuselage';
import { useSubscription } from 'use-subscription';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import CustomFieldsForm from './CustomFieldsForm';
import Page from '../../components/basic/Page';
import PageSkeleton from '../../components/PageSkeleton';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRouteParameter, useRoute } from '../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useMethod } from '../../contexts/ServerContext';
import { formsSubscription } from '../additionalForms';
import { useForm } from '../../hooks/useForm';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';

const getInitialValues = (cf) => ({
	field: cf._id,
	label: cf.label,
	scope: cf.scope,
	visibility: cf.visibility === 'visible',
	regexp: cf.regexp,
});

const EditCustomFieldsPageContainer = () => {
	const t = useTranslation();
	const id = useRouteParameter('id');

	const { data, state, error } = useEndpointDataExperimental(`livechat/custom-fields/${ id }`);

	if (state === ENDPOINT_STATES.LOADING) {
		return <PageSkeleton />;
	}

	if (!data || !data.success || !data.customField || error) {
		return <Page>
			<Page.Header title={t('Edit_Custom_Field')}/>
			<Page.ScrollableContentWithShadow>
				<Callout type='danger'>
					{t('Error')}
				</Callout>
			</Page.ScrollableContentWithShadow>
		</Page>;
	}

	return <EditCustomFieldsPage customField={data.customField} id={id}/>;
};


const EditCustomFieldsPage = ({ customField, id }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [additionalValues, setAdditionalValues] = useState({});

	const { useCustomFieldsAdditionalForm = () => {} } = useSubscription(formsSubscription);
	const AdditionalForm = useCustomFieldsAdditionalForm();

	const router = useRoute('omnichannel-customfields');

	const handleReturn = useCallback(() => {
		router.push({});
	}, [router]);

	const { values, handlers, hasUnsavedChanges } = useForm(getInitialValues(customField));

	const save = useMethod('livechat:saveCustomField');

	const { hasError, data: additionalData, hasUnsavedChanges: additionalFormChanged } = additionalValues;

	const canSave = !hasError && (additionalFormChanged || hasUnsavedChanges);

	const handleSave = useMutableCallback(async () => {
		try {
			await save(id, {
				...additionalData,
				...values,
				visibility: values.visibility ? 'visible' : 'hidden',
			});

			dispatchToastMessage({ type: 'success', message: t('Saved') });
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleAdditionalForm = useMutableCallback((val) => {
		setAdditionalValues({ ...additionalValues, ...val });
	});

	return <Page>
		<Page.Header title={t('Edit_Custom_Field')}>
			<ButtonGroup align='end'>
				<Button onClick={handleReturn}>
					<Icon size='x16' name='back'/>{t('Back')}
				</Button>
				<Button primary onClick={handleSave} disabled={!canSave}>
					{t('Save')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<Box maxWidth='x600' w='full' alignSelf='center'>
				<FieldGroup>
					<CustomFieldsForm values={values} handlers={handlers}/>
					{AdditionalForm && <AdditionalForm onChange={handleAdditionalForm} state={values} data={customField}/>}
				</FieldGroup>
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default EditCustomFieldsPageContainer;
