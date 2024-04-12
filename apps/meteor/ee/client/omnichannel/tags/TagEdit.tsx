import type { ILivechatDepartment, ILivechatTag, Serialized } from '@rocket.chat/core-typings';
import { Field, FieldLabel, FieldRow, FieldError, TextInput, Button, ButtonGroup, FieldGroup, Box } from '@rocket.chat/fuselage';
import { useMutableCallback, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRouter, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';

import AutoCompleteDepartmentMultiple from '../../../../client/components/AutoCompleteDepartmentMultiple';
import {
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarTitle,
	Contextualbar,
	ContextualbarHeader,
	ContextualbarClose,
} from '../../../../client/components/Contextualbar';
import { useRemoveTag } from './useRemoveTag';

type TagEditPayload = {
	name: string;
	description: string;
	departments: { label: string; value: string }[];
};

type TagEditProps = {
	tagData?: ILivechatTag;
	currentDepartments?: Serialized<ILivechatDepartment>[];
};

const TagEdit = ({ tagData, currentDepartments }: TagEditProps) => {
	const t = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();
	const handleDeleteTag = useRemoveTag();

	const dispatchToastMessage = useToastMessageDispatch();
	const saveTag = useMethod('livechat:saveTag');

	const { _id, name, description } = tagData || {};

	const {
		control,
		formState: { isDirty, errors },
		handleSubmit,
	} = useForm<TagEditPayload>({
		mode: 'onBlur',
		values: {
			name: name || '',
			description: description || '',
			departments: currentDepartments?.map((dep) => ({ label: dep.name, value: dep._id })) || [],
		},
	});

	const handleSave = useMutableCallback(async ({ name, description, departments }: TagEditPayload) => {
		const departmentsId = departments?.map((dep) => dep.value) || [''];

		try {
			await saveTag(_id as unknown as string, { name, description }, departmentsId);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			queryClient.invalidateQueries(['livechat-tags']);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			router.navigate('/omnichannel/tags');
		}
	});

	const formId = useUniqueId();
	const nameField = useUniqueId();
	const descriptionField = useUniqueId();
	const departmentsField = useUniqueId();

	return (
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarTitle>{_id ? t('Edit_Tag') : t('New_Tag')}</ContextualbarTitle>
				<ContextualbarClose onClick={() => router.navigate('/omnichannel/tags')}></ContextualbarClose>
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<Box id={formId} is='form' autoComplete='off' onSubmit={handleSubmit(handleSave)}>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor={nameField} required>
								{t('Name')}
							</FieldLabel>
							<FieldRow>
								<Controller
									name='name'
									control={control}
									rules={{ required: t('The_field_is_required', 'name') }}
									render={({ field }) => <TextInput {...field} error={errors?.name?.message} aria-describedby={`${nameField}-error`} />}
								/>
							</FieldRow>
							{errors?.name && (
								<FieldError aria-live='assertive' id={`${nameField}-error`}>
									{errors?.name?.message}
								</FieldError>
							)}
						</Field>
						<Field>
							<FieldLabel htmlFor={descriptionField}>{t('Description')}</FieldLabel>
							<FieldRow>
								<Controller name='description' control={control} render={({ field }) => <TextInput id={descriptionField} {...field} />} />
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={departmentsField}>{t('Departments')}</FieldLabel>
							<FieldRow>
								<Controller
									name='departments'
									control={control}
									render={({ field: { onChange, value, onBlur } }) => (
										<AutoCompleteDepartmentMultiple id={departmentsField} onChange={onChange} value={value} onBlur={onBlur} showArchived />
									)}
								/>
							</FieldRow>
						</Field>
					</FieldGroup>
				</Box>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={() => router.navigate('/omnichannel/tags')}>{t('Cancel')}</Button>
					<Button form={formId} disabled={!isDirty} type='submit' primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
				{_id && (
					<Box mbs={8}>
						<ButtonGroup stretch>
							<Button icon='trash' danger onClick={() => handleDeleteTag(_id)}>
								{t('Delete')}
							</Button>
						</ButtonGroup>
					</Box>
				)}
			</ContextualbarFooter>
		</Contextualbar>
	);
};

export default TagEdit;
