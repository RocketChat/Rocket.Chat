import type { ILivechatDepartment, ILivechatUnitMonitor, Serialized, IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import {
	FieldError,
	Field,
	TextInput,
	Button,
	PaginatedMultiSelectFiltered,
	Select,
	ButtonGroup,
	FieldGroup,
	Box,
	FieldLabel,
	FieldRow,
	CheckOption,
} from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useId, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { useRemoveUnit } from './useRemoveUnit';
import {
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarTitle,
	Contextualbar,
	ContextualbarHeader,
	ContextualbarClose,
} from '../../components/Contextualbar';
import { useRecordList } from '../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../hooks/useAsyncState';
import { useDepartmentsByUnitsList } from '../../views/hooks/useDepartmentsByUnitsList';
import { useMonitorsList } from '../../views/hooks/useMonitorsList';

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
};

const UnitEdit = ({ unitData, unitMonitors, unitDepartments }: UnitEditProps) => {
	const t = useTranslation();
	const router = useRouter();
	const saveUnit = useMethod('livechat:saveUnit');
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const handleDeleteUnit = useRemoveUnit();

	const [monitorsFilter, setMonitorsFilter] = useState('');
	const debouncedMonitorsFilter = useDebouncedValue(monitorsFilter, 500);

	const [departmentsFilter, setDepartmentsFilter] = useState('');
	const debouncedDepartmentsFilter = useDebouncedValue(departmentsFilter, 500);

	const { itemsList: monitorsList, loadMoreItems: loadMoreMonitors } = useMonitorsList(
		useMemo(() => ({ filter: debouncedMonitorsFilter }), [debouncedMonitorsFilter]),
	);

	const { phase: monitorsPhase, items: monitorsItems, itemCount: monitorsTotal } = useRecordList(monitorsList);

	const { itemsList: departmentsList, loadMoreItems: loadMoreDepartments } = useDepartmentsByUnitsList(
		useMemo(() => ({ filter: debouncedDepartmentsFilter, unitId: unitData?._id }), [debouncedDepartmentsFilter, unitData?._id]),
	);

	const { phase: departmentsPhase, items: departmentsItems, itemCount: departmentsTotal } = useRecordList(departmentsList);

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

	const departmentsOptions = useMemo(() => {
		const pending = departments.filter(({ value }) => !departmentsItems.find((dep) => dep._id === value));
		const mappedDepartmentsItems = departmentsItems?.map(({ _id, name }) => ({
			value: _id,
			label: name,
		}));
		return [...mappedDepartmentsItems, ...pending];
	}, [departments, departmentsItems]);

	const monitorsOptions = useMemo(() => {
		const pending = monitors.filter(({ value }) => !monitorsItems.find((mon) => mon._id === value));
		const mappedMonitorsItems = monitorsItems?.map(({ _id, name }) => ({
			value: _id,
			label: name,
		}));
		return [...mappedMonitorsItems, ...pending];
	}, [monitors, monitorsItems]);

	const handleSave = useEffectEvent(async ({ name, visibility }: UnitEditFormData) => {
		const departmentsData = departments.map((department) => ({ departmentId: department.value }));

		const monitorsData = monitors.map((monitor) => ({
			monitorId: monitor.value,
			username: monitor.label,
		}));

		try {
			await saveUnit(_id as unknown as string, { name, visibility }, monitorsData, departmentsData);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			queryClient.invalidateQueries({
				queryKey: ['livechat-units'],
			});
			router.navigate('/omnichannel/units');
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
		<Contextualbar data-qa-id='units-contextual-bar'>
			<ContextualbarHeader>
				<ContextualbarTitle>{_id ? t('Edit_Unit') : t('New_Unit')}</ContextualbarTitle>
				<ContextualbarClose onClick={() => router.navigate('/omnichannel/units')}></ContextualbarClose>
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
							<FieldLabel htmlFor={departmentsField} required>
								{t('Departments')}
							</FieldLabel>
							<FieldRow>
								<Controller
									name='departments'
									control={control}
									rules={{ required: t('Required_field', { field: t('Departments') }) }}
									render={({ field: { name, value, onChange, onBlur } }) => (
										<PaginatedMultiSelectFiltered
											id={departmentsField}
											name={name}
											value={value}
											onChange={onChange}
											onBlur={onBlur}
											withTitle
											filter={departmentsFilter}
											setFilter={setDepartmentsFilter}
											options={departmentsOptions}
											error={Boolean(errors?.departments)}
											placeholder={t('Select_an_option')}
											endReached={
												departmentsPhase === AsyncStatePhase.LOADING
													? undefined
													: (start) => start && loadMoreDepartments(start, Math.min(50, departmentsTotal))
											}
											aria-describedby={`${departmentsField}-error`}
											aria-required={true}
											aria-invalid={Boolean(errors?.departments)}
											renderItem={({ label, ...props }) => (
												<CheckOption
													{...props}
													label={<span style={{ whiteSpace: 'normal' }}>{label}</span>}
													selected={value.some((item) => item.value === props.value)}
												/>
											)}
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
										<PaginatedMultiSelectFiltered
											id={monitorsField}
											name={name}
											value={value}
											onChange={onChange}
											onBlur={onBlur}
											withTitle
											filter={monitorsFilter}
											setFilter={setMonitorsFilter}
											options={monitorsOptions}
											error={Boolean(errors?.monitors)}
											placeholder={t('Select_an_option')}
											endReached={
												monitorsPhase === AsyncStatePhase.LOADING
													? undefined
													: (start) => start && loadMoreMonitors(start, Math.min(50, monitorsTotal))
											}
											aria-describedby={`${monitorsField}-error`}
											aria-required={true}
											aria-invalid={Boolean(errors?.monitors)}
											renderItem={({ label, ...props }) => (
												<CheckOption {...props} label={label} selected={value.some((item) => item.value === props.value)} />
											)}
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
					<Button onClick={() => router.navigate('/omnichannel/units')}>{t('Cancel')}</Button>
					<Button form={formId} disabled={!isDirty} type='submit' primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
				{_id && (
					<Box mbs={8}>
						<ButtonGroup stretch>
							<Button icon='trash' danger onClick={() => handleDeleteUnit(_id)}>
								{t('Delete')}
							</Button>
						</ButtonGroup>
					</Box>
				)}
			</ContextualbarFooter>
		</Contextualbar>
	);
};

export default UnitEdit;
