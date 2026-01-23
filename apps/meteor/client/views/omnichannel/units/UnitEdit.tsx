import type {
	ILivechatDepartment,
	ILivechatUnitMonitor,
	Serialized,
	IOmnichannelBusinessUnit,
	OmnichannelBusinessUnitPayload,
} from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { FieldError, Field, TextInput, Button, Select, ButtonGroup, FieldGroup, Box, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarTitle,
	ContextualbarHeader,
	ContextualbarClose,
} from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useId, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import AutoCompleteDepartmentMultiple from '../components/AutoCompleteDepartmentMultiple';
import AutoCompleteMonitors from '../components/AutoCompleteMonitors';

type UnitEditFormData = {
	name: string;
	visibility: string;
	departments: {
		value: string;
		label: string;
	}[];
	monitors: {
		value: string;
		label: string;
	}[];
};

type UnitEditProps = {
	unitData?: Serialized<IOmnichannelBusinessUnit>;
	unitMonitors?: Serialized<ILivechatUnitMonitor>[];
	unitDepartments?: Serialized<ILivechatDepartment>[];
	onUpdate?: (params: OmnichannelBusinessUnitPayload) => void;
	onDelete?: () => void;
	onClose: () => void;
};

const UnitEdit = ({ unitData, unitMonitors, unitDepartments, onUpdate, onDelete, onClose }: UnitEditProps) => {
	const t = useTranslation();
	const saveUnit = useEndpoint('POST', '/v1/livechat/units');
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const visibilityOpts: SelectOption[] = [
		['public', t('Public')],
		['private', t('Private')],
	];

	const { _id } = unitData || {};

	const currUnitDepartments = useMemo(
		() =>
			unitDepartments?.map(({ _id, name }) => ({
				value: _id,
				label: name,
			})) || [],
		[unitDepartments],
	);

	const currUnitMonitors = useMemo(
		() =>
			unitMonitors?.map(({ monitorId, username }) => ({
				value: monitorId,
				label: username,
			})) || [],
		[unitMonitors],
	);

	const {
		control,
		formState: { errors, isDirty },
		handleSubmit,
		watch,
	} = useForm<UnitEditFormData>({
		mode: 'onBlur',
		values: {
			name: unitData?.name || '',
			visibility: unitData?.visibility || '',
			departments: currUnitDepartments,
			monitors: currUnitMonitors,
		},
	});

	const { departments, monitors } = watch();

	const handleSave = useEffectEvent(async ({ name, visibility }: UnitEditFormData) => {
		const departmentsData = departments.map((department) => ({ departmentId: department.value }));

		const monitorsData = monitors.map((monitor) => ({
			monitorId: monitor.value,
			username: monitor.label,
		}));

		const payload = {
			unitData: { name, visibility },
			unitMonitors: monitorsData,
			unitDepartments: departmentsData,
		};

		try {
			if (_id && onUpdate) {
				await onUpdate(payload);
			} else {
				await saveUnit(payload);
			}

			dispatchToastMessage({ type: 'success', message: t('Saved') });
			queryClient.invalidateQueries({
				queryKey: ['livechat-units'],
			});
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const formId = useId();
	const nameField = useId();
	const visibilityField = useId();
	const departmentsField = useId();
	const monitorsField = useId();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarTitle>{_id ? t('Edit_Unit') : t('New_Unit')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose}></ContextualbarClose>
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
									render={({ field }) => (
										<TextInput
											id={nameField}
											{...field}
											error={errors?.name?.message}
											aria-describedby={`${nameField}-error`}
											aria-required={true}
											aria-invalid={Boolean(errors?.name)}
										/>
									)}
								/>
							</FieldRow>
							{errors?.name && (
								<FieldError aria-live='assertive' id={`${nameField}-error`}>
									{errors?.name.message}
								</FieldError>
							)}
						</Field>
						<Field>
							<FieldLabel htmlFor={visibilityField} required>
								{t('Visibility')}
							</FieldLabel>
							<FieldRow>
								<Controller
									name='visibility'
									control={control}
									rules={{ required: t('Required_field', { field: t('Visibility') }) }}
									render={({ field }) => (
										<Select
											id={visibilityField}
											{...field}
											options={visibilityOpts}
											error={errors?.visibility?.message}
											placeholder={t('Select_an_option')}
											aria-describedby={`${visibilityField}-error`}
											aria-required={true}
											aria-invalid={Boolean(errors?.visibility)}
										/>
									)}
								/>
							</FieldRow>
							{errors?.visibility && <FieldError id={`${visibilityField}-error`}>{errors?.visibility.message}</FieldError>}
						</Field>
						<Field>
							<FieldLabel id={departmentsField} required>
								{t('Departments')}
							</FieldLabel>
							<FieldRow>
								<Controller
									name='departments'
									control={control}
									rules={{ required: t('Required_field', { field: t('Departments') }) }}
									render={({ field: { name, value, onChange, onBlur } }) => (
										<AutoCompleteDepartmentMultiple
											withCheckbox
											name={name}
											value={value}
											unitId={unitData?._id}
											error={Boolean(errors?.departments)}
											aria-describedby={`${departmentsField}-error`}
											aria-required={true}
											aria-labelledby={departmentsField}
											aria-invalid={Boolean(errors?.departments)}
											onChange={onChange}
											onBlur={onBlur}
										/>
									)}
								/>
							</FieldRow>
							{errors?.departments && (
								<FieldError aria-live='assertive' id={`${departmentsField}-error`}>
									{errors?.departments.message}
								</FieldError>
							)}
						</Field>
						<Field>
							<FieldLabel htmlFor={monitorsField} required>
								{t('Monitors')}
							</FieldLabel>
							<FieldRow>
								<Controller
									name='monitors'
									control={control}
									rules={{ required: t('Required_field', { field: t('Monitors') }) }}
									render={({ field: { name, value, onChange, onBlur } }) => (
										<AutoCompleteMonitors
											id={monitorsField}
											name={name}
											value={value}
											error={Boolean(errors?.monitors)}
											aria-describedby={`${monitorsField}-error`}
											aria-required={true}
											aria-invalid={Boolean(errors?.monitors)}
											onChange={onChange}
											onBlur={onBlur}
										/>
									)}
								/>
							</FieldRow>
							{errors?.monitors && (
								<FieldError aria-live='assertive' id={`${monitorsField}-error`}>
									{errors?.monitors.message}
								</FieldError>
							)}
						</Field>
					</FieldGroup>
				</Box>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button form={formId} disabled={!isDirty} type='submit' primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
				{_id && (
					<Box mbs={8}>
						<ButtonGroup stretch>
							<Button icon='trash' danger onClick={() => onDelete?.()}>
								{t('Delete')}
							</Button>
						</ButtonGroup>
					</Box>
				)}
			</ContextualbarFooter>
		</>
	);
};

export default UnitEdit;
