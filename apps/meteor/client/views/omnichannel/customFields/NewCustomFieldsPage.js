import { Box, Button, Icon, FieldGroup, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState } from 'react';
import { useSubscription } from 'use-subscription';

import Page from '../../../components/Page';
import { useForm } from '../../../hooks/useForm';
import { formsSubscription } from '../additionalForms';
import CustomFieldsForm from './CustomFieldsForm';

const initialValues = {
	field: '',
	label: '',
	scope: 'visitor',
	visibility: true,
	regexp: '',
};

const NewCustomFieldsPage = ({ reload }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [additionalValues, setAdditionalValues] = useState({});

	const { useCustomFieldsAdditionalForm = () => {} } = useSubscription(formsSubscription);
	const AdditionalForm = useCustomFieldsAdditionalForm();

	const router = useRoute('omnichannel-customfields');

	const handleReturn = useCallback(() => {
		router.push({});
	}, [router]);

	const { values, handlers, hasUnsavedChanges } = useForm(initialValues);

	const save = useMethod('livechat:saveCustomField');

	const { hasError, data: additionalData, hasUnsavedChanges: additionalFormChanged } = additionalValues;

	const { label, field } = values;

	const canSave = !hasError && label && field && (additionalFormChanged || hasUnsavedChanges);

	const handleSave = useMutableCallback(async () => {
		try {
			await save(undefined, {
				...values,
				visibility: values.visibility ? 'visible' : 'hidden',
				...additionalData,
			});

			dispatchToastMessage({ type: 'success', message: t('Saved') });
			reload();
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleAdditionalForm = useMutableCallback((val) => {
		setAdditionalValues({ ...additionalValues, ...val });
	});

	return (
		<Page>
			<Page.Header title={t('New_Custom_Field')}>
				<ButtonGroup>
					<Button onClick={handleReturn}>
						<Icon size='x16' name='back' />
						{t('Back')}
					</Button>
					<Button primary onClick={handleSave} disabled={!canSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center'>
					<FieldGroup>
						<CustomFieldsForm values={values} handlers={handlers} />
						{AdditionalForm && <AdditionalForm onChange={handleAdditionalForm} state={values} />}
					</FieldGroup>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default NewCustomFieldsPage;
