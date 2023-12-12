import { css } from '@rocket.chat/css-in-js';
import { Box, Field, FieldLabel, FieldRow, FieldError, TextInput, FieldGroup, RadioButton, FieldHint } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

import AutoCompleteDepartment from '../../../../../client/components/AutoCompleteDepartment';
import Tags from '../../../../../client/components/Omnichannel/Tags';
import MarkdownTextEditor from './MarkdownTextEditor';
import PreviewText from './PreviewText';

// TODO: refactor Message field to get proper validation
// TODO: refactor Tags field to get proper validation
const CannedResponseForm = () => {
	const t = useTranslation();
	const hasManagerPermission = usePermission('view-all-canned-responses');
	const hasMonitorPermission = usePermission('save-department-canned-responses');

	const {
		control,
		formState: { errors },
		watch,
	} = useFormContext();

	const clickable = css`
		cursor: pointer;
	`;

	const { text, scope } = watch();
	const [preview, setPreview] = useState(false);

	const shortcutField = useUniqueId();
	const publicRadioField = useUniqueId();
	const departmentRadioField = useUniqueId();
	const privateRadioField = useUniqueId();
	const departmentField = useUniqueId();

	return (
		<FieldGroup>
			<Field>
				<FieldLabel htmlFor={shortcutField}>{t('Shortcut')}</FieldLabel>
				<Controller
					name='shortcut'
					control={control}
					rules={{ required: t('The_field_is_required', t('Shortcut')) }}
					render={({ field }) => (
						<TextInput
							{...field}
							id={shortcutField}
							placeholder={`!${t('shortcut_name')}`}
							aria-required={true}
							aria-invalid={Boolean(errors?.shortcut)}
							aria-describedby={`${shortcutField}-error`}
						/>
					)}
				/>
				{errors?.shortcut && (
					<FieldError aria-live='assertive' id={`${shortcutField}-error`}>
						{errors.shortcut.message}
					</FieldError>
				)}
			</Field>
			<Field>
				<FieldLabel w='full'>
					<Box w='full' display='flex' flexDirection='row' justifyContent='space-between'>
						{t('Message')}
						{text !== '' && (
							<Box className={clickable} color='info' onClick={() => setPreview(!preview)}>
								{preview ? t('Editor') : t('Preview')}
							</Box>
						)}
					</Box>
				</FieldLabel>
				{preview ? (
					<PreviewText text={text} />
				) : (
					<Controller
						name='text'
						control={control}
						rules={{ required: t('Field_required') }}
						render={({ field: { value, onChange } }) => <MarkdownTextEditor value={value} onChange={onChange} />}
					/>
				)}
				{errors?.text && <FieldError>{errors.text.message}</FieldError>}
			</Field>
			<Field>
				<Controller name='tags' control={control} render={({ field: { value, onChange } }) => <Tags handler={onChange} tags={value} />} />
			</Field>
			{(hasManagerPermission || hasMonitorPermission) && (
				<>
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<FieldLabel htmlFor={publicRadioField}>{t('Public')}</FieldLabel>
							<FieldRow>
								<Controller
									name='scope'
									control={control}
									render={({ field: { onChange, value, ...field } }) => (
										<RadioButton
											{...field}
											id={publicRadioField}
											onChange={() => onChange('global')}
											disabled={hasMonitorPermission && !hasManagerPermission}
											checked={value === 'global'}
											aria-describedby={`${publicRadioField}-hint`}
										/>
									)}
								/>
							</FieldRow>
						</Box>
						<FieldHint id={`${publicRadioField}-hint`}>{t('Canned_Response_Sharing_Public_Description')}</FieldHint>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<FieldLabel htmlFor={departmentRadioField}>{t('Department')}</FieldLabel>
							<FieldRow>
								<Controller
									name='scope'
									control={control}
									render={({ field: { onChange, value, ...field } }) => (
										<RadioButton
											{...field}
											id={departmentRadioField}
											onChange={() => onChange('department')}
											checked={value === 'department'}
											aria-describedby={`${departmentRadioField}-hint`}
										/>
									)}
								/>
							</FieldRow>
						</Box>
						<FieldHint id={`${departmentRadioField}-hint`}>{t('Canned_Response_Sharing_Department_Description')}</FieldHint>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<FieldLabel htmlFor={privateRadioField}>{t('Private')}</FieldLabel>
							<FieldRow>
								<Controller
									name='scope'
									control={control}
									render={({ field: { onChange, value, ...field } }) => (
										<RadioButton
											{...field}
											id={privateRadioField}
											onChange={() => onChange('user')}
											checked={value === 'user'}
											aria-describedby={`${privateRadioField}-hint`}
										/>
									)}
								/>
							</FieldRow>
						</Box>
						<FieldHint id={`${privateRadioField}-hint`}>{t('Canned_Response_Sharing_Private_Description')}</FieldHint>
					</Field>
					{scope === 'department' && (
						<Field>
							<FieldLabel htmlFor={departmentField}>{t('Department')}</FieldLabel>
							<FieldRow>
								<Controller
									name='departmentId'
									control={control}
									rules={{ required: t('The_field_is_required', t('Department')) }}
									render={({ field: { value, onChange } }) => (
										<AutoCompleteDepartment
											{...(hasMonitorPermission && { onlyMyDepartments: hasMonitorPermission })}
											id={departmentField}
											value={value}
											onChange={onChange}
											aria-describedby={`${departmentField}-error`}
											aria-required={true}
											aria-invalid={Boolean(errors?.departmentId)}
										/>
									)}
								/>
							</FieldRow>
							{errors?.departmentId && (
								<FieldError aria-live='assertive' id={departmentField}>
									{errors.departmentId.message}
								</FieldError>
							)}
						</Field>
					)}
				</>
			)}
		</FieldGroup>
	);
};

export default CannedResponseForm;
