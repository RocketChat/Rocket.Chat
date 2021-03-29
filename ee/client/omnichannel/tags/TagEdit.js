import { Field, TextInput, Button, Box, MultiSelect, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo } from 'react';

import VerticalBar from '../../../../client/components/VerticalBar';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../client/hooks/useForm';

function TagEdit({ data, tagId, isNew, availableDepartments, reload, ...props }) {
	const t = useTranslation();
	const tagsRoute = useRoute('omnichannel-tags');

	const tag = data || {};

	const options = useMemo(
		() =>
			availableDepartments && availableDepartments.departments
				? availableDepartments.departments.map(({ _id, name }) => [_id, name || _id])
				: [],
		[availableDepartments],
	);

	const { values, handlers, hasUnsavedChanges } = useForm({
		name: tag.name,
		description: tag.description,
		departments: tag.departments && tag.departments[0] === '' ? [] : tag.departments,
	});

	const { handleName, handleDescription, handleDepartments } = handlers;
	const { name, description, departments } = values;

	const nameError = useMemo(
		() => (!name || name.length === 0 ? t('The_field_is_required', 'name') : undefined),
		[name, t],
	);

	const saveTag = useMethod('livechat:saveTag');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleReset = useMutableCallback(() => {
		reload();
	});

	const canSave = useMemo(() => !nameError, [nameError]);

	const handleSave = useMutableCallback(async () => {
		const tagData = { name, description };

		if (!canSave) {
			return dispatchToastMessage({ type: 'error', message: t('The_field_is_required') });
		}

		const finalDepartments = departments || [''];

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
		<VerticalBar.ScrollableContent is='form' {...props}>
			<Field>
				<Field.Label>{t('Name')}*</Field.Label>
				<Field.Row>
					<TextInput
						placeholder={t('Name')}
						flexGrow={1}
						value={name}
						onChange={handleName}
						error={hasUnsavedChanges && nameError}
					/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Description')}</Field.Label>
				<Field.Row>
					<TextInput
						placeholder={t('Description')}
						flexGrow={1}
						value={description}
						onChange={handleDescription}
					/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Departments')}</Field.Label>
				<Field.Row>
					<MultiSelect
						options={options}
						value={departments}
						maxWidth='100%'
						placeholder={t('Select_an_option')}
						onChange={handleDepartments}
						flexGrow={1}
					/>
				</Field.Row>
			</Field>

			<Field.Row>
				<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
					<Margins inlineEnd='x4'>
						{!isNew && (
							<Button flexGrow={1} type='reset' disabled={!hasUnsavedChanges} onClick={handleReset}>
								{t('Reset')}
							</Button>
						)}
						<Button
							primary
							mie='none'
							flexGrow={1}
							disabled={!hasUnsavedChanges || !canSave}
							onClick={handleSave}
						>
							{t('Save')}
						</Button>
					</Margins>
				</Box>
			</Field.Row>
		</VerticalBar.ScrollableContent>
	);
}

export default TagEdit;
