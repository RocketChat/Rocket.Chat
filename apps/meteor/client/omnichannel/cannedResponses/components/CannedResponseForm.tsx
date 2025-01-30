import { css } from '@rocket.chat/css-in-js';
import { Box, Field, FieldLabel, FieldRow, FieldError, TextInput, FieldGroup, RadioButton, FieldHint, Option } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useId, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import CannedResponsesComposer from './CannedResponsesComposer/CannedResponsesComposer';
import CannedResponsesComposerPreview from './CannedResponsesComposer/CannedResponsesComposerPreview';
import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import Tags from '../../../components/Omnichannel/Tags';
import type { CannedResponseEditFormData } from '../CannedResponseEdit';

// TODO: refactor Tags field to get proper validation
const CannedResponseForm = () => {
	const { t } = useTranslation();
	const hasManagerPermission = usePermission('view-all-canned-responses');
	const hasMonitorPermission = usePermission('save-department-canned-responses');

	const {
		control,
		formState: { errors },
		watch,
	} = useFormContext<CannedResponseEditFormData>();

	const clickable = css`
		cursor: pointer;
	`;

	const { text, scope } = watch();
	const [preview, setPreview] = useState(false);

	const shortcutField = useId();
	const messageField = useId();
	const publicRadioField = useId();
	const departmentRadioField = useId();
	const privateRadioField = useId();
	const departmentField = useId();

	return (
		<FieldGroup>
			<Field>
				<FieldLabel htmlFor={shortcutField}>{t('Shortcut')}</FieldLabel>
				<Controller
					name='shortcut'
					control={control}
					rules={{ required: t('Required_field', { field: t('Shortcut') }) }}
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
				<FieldLabel htmlFor={messageField} w='full' display='flex' flexDirection='row' justifyContent='space-between'>
					{t('Message')}
					{text !== '' && (
						<Box className={clickable} color='info' onClick={() => setPreview(!preview)}>
							{preview ? t('Editor') : t('Preview')}
						</Box>
					)}
				</FieldLabel>
				{preview ? (
					<CannedResponsesComposerPreview text={text} />
				) : (
					<Controller
						name='text'
						control={control}
						rules={{ required: t('Required_field', { field: t('Message') }) }}
						render={({ field: { value, onChange, name, onBlur } }) => (
							<CannedResponsesComposer
								id={messageField}
								value={value}
								onChange={onChange}
								name={name}
								onBlur={onBlur}
								aria-describedby={`${messageField}-error`}
								aria-required={true}
								aria-invalid={Boolean(errors.text)}
							/>
						)}
					/>
				)}
				{errors?.text && (
					<FieldError aria-live='assertive' id={`${messageField}-error`}>
						{errors.text.message}
					</FieldError>
				)}
			</Field>
			<Field>
				<Controller
					name='tags'
					control={control}
					render={({ field: { value, onChange } }) => <Tags handler={onChange} tags={value as unknown as string[]} />} // FIXME: fix types
				/>
			</Field>
			{(hasManagerPermission || hasMonitorPermission) && (
				<>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={publicRadioField}>{t('Public')}</FieldLabel>
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
										data-qa-id='canned-response-public-radio'
									/>
								)}
							/>
						</FieldRow>
						<FieldHint id={`${publicRadioField}-hint`}>{t('Canned_Response_Sharing_Public_Description')}</FieldHint>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={departmentRadioField}>{t('Department')}</FieldLabel>
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
						<FieldHint id={`${departmentRadioField}-hint`}>{t('Canned_Response_Sharing_Department_Description')}</FieldHint>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={privateRadioField}>{t('Private')}</FieldLabel>
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
						<FieldHint id={`${privateRadioField}-hint`}>{t('Canned_Response_Sharing_Private_Description')}</FieldHint>
					</Field>
					{scope === 'department' && (
						<Field>
							<FieldLabel htmlFor={departmentField}>{t('Department')}</FieldLabel>
							<FieldRow>
								<Controller
									name='departmentId'
									control={control}
									rules={{ required: t('Required_field', { field: t('Department') }) }}
									render={({ field: { value, onChange } }) => (
										<AutoCompleteDepartment
											{...(hasMonitorPermission && { onlyMyDepartments: hasMonitorPermission })}
											id={departmentField}
											value={value}
											onChange={onChange}
											aria-describedby={`${departmentField}-error`}
											aria-required={true}
											aria-invalid={Boolean(errors?.departmentId)}
											withTitle={false}
											renderItem={({ label, ...props }) => (
												<Option {...props} label={<span style={{ whiteSpace: 'normal' }}>{label}</span>} />
											)}
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
