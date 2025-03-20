import type { ILivechatDepartment, ILivechatTag, Serialized } from '@rocket.chat/core-typings';
import { Field, FieldLabel, FieldRow, FieldError, TextInput, Button, ButtonGroup, FieldGroup, Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRouter, useMethod } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useRemoveTag } from './useRemoveTag';
import AutoCompleteDepartmentMultiple from '../../components/AutoCompleteDepartmentMultiple';
import {
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarTitle,
	Contextualbar,
	ContextualbarHeader,
	ContextualbarClose,
} from '../../components/Contextualbar';

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
	const { t } = useTranslation();
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

	const handleSave = useEffectEvent(async ({ name, description, departments }: TagEditPayload) => {
		const departmentsId = departments?.map((dep) => dep.value) || [''];

		try {
			await saveTag(_id as unknown as string, { name, description }, departmentsId);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			queryClient.invalidateQueries({
				queryKey: ['livechat-tags'],
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			router.navigate('/omnichannel/tags');
		}
	});

	const formId = useId();
	const nameField = useId();
	const descriptionField = useId();
	const departmentsField = useId();

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
									rules={{ required: t('Required_field', { field: t('Name') }) }}
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
									render={({ field }) => <AutoCompleteDepartmentMultiple id={departmentsField} showArchived {...field} />}
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
