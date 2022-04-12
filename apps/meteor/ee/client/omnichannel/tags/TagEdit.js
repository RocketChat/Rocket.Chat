import { Field, TextInput, Button, ButtonGroup, Icon, FieldGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo } from 'react';

import AutoCompleteDepartmentMultiple from '../../../../client/components/AutoCompleteDepartmentMultiple';
import Page from '../../../../client/components/Page';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../client/hooks/useForm';

function TagEdit({ title, data, tagId, reload, currentDepartments, ...props }) {
	const t = useTranslation();
	const tagsRoute = useRoute('omnichannel-tags');

	const tag = data || {};

	const { values, handlers, hasUnsavedChanges } = useForm({
		name: tag.name,
		description: tag.description,
		departments:
			currentDepartments && currentDepartments.departments
				? currentDepartments.departments.map((dep) => ({ label: dep.name, value: dep._id }))
				: [],
	});

	const { handleName, handleDescription, handleDepartments } = handlers;
	const { name, description, departments } = values;

	const nameError = useMemo(() => (!name || name.length === 0 ? t('The_field_is_required', 'name') : undefined), [name, t]);

	const saveTag = useMethod('livechat:saveTag');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleReturn = useMutableCallback(() => {
		tagsRoute.push({});
	});

	const canSave = useMemo(() => !nameError, [nameError]);

	const handleSave = useMutableCallback(async () => {
		const tagData = { name, description };

		if (!canSave) {
			return dispatchToastMessage({ type: 'error', message: t('The_field_is_required') });
		}

		const finalDepartments = departments ? departments.map((dep) => dep.value) : [''];

		try {
			await saveTag(tagId, tagData, finalDepartments);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			reload();
			tagsRoute.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={title}>
					<ButtonGroup>
						<Button onClick={handleReturn}>
							<Icon name='back' /> {t('Back')}
						</Button>
						<Button primary mie='none' flexGrow={1} disabled={!hasUnsavedChanges || !canSave} onClick={handleSave}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</Page.Header>
				<Page.ScrollableContentWithShadow>
					<FieldGroup w='full' alignSelf='center' maxWidth='x600' is='form' autoComplete='off' {...props}>
						<Field>
							<Field.Label>{t('Name')}*</Field.Label>
							<Field.Row>
								<TextInput placeholder={t('Name')} flexGrow={1} value={name} onChange={handleName} error={hasUnsavedChanges && nameError} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Description')}</Field.Label>
							<Field.Row>
								<TextInput placeholder={t('Description')} flexGrow={1} value={description} onChange={handleDescription} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Departments')}</Field.Label>
							<Field.Row>
								<AutoCompleteDepartmentMultiple value={departments} onChange={handleDepartments} />
							</Field.Row>
						</Field>
					</FieldGroup>
				</Page.ScrollableContentWithShadow>
			</Page>
		</Page>
	);
}

export default TagEdit;
