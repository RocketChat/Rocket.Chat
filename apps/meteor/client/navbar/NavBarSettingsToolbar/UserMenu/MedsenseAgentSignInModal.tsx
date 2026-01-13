import type { SelectOption } from '@rocket.chat/fuselage';
import {
	Box,
	Button,
	ButtonGroup,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldRow,
	InputBox,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalTitle,
	Select,
} from '@rocket.chat/fuselage';
import { useMethod, useSetting, useToastMessageDispatch, useUser } from '@rocket.chat/ui-contexts';
import { format } from 'date-fns';
import type { ChangeEvent, FormEvent } from 'react';
import { memo, useEffect, useMemo, useState, useId } from 'react';
import { useTranslation } from 'react-i18next';

type MedsenseAgentSignInModalProps = {
	onClose: () => void;
};

const MedsenseAgentSignInModal = ({ onClose }: MedsenseAgentSignInModalProps) => {
	const { t } = useTranslation();
	const signIn = useMethod('medsenseAgentSignIn');
	const signOut = useMethod('medsenseAgentSignOut');
	const dispatchToastMessage = useToastMessageDispatch();
	const user = useUser();
	const pharmacistRolesSetting = useSetting<string[] | string>('Medsense_Sign_In_Role_Pharmacist_Roles', []);
	const technicianRolesSetting = useSetting<string[] | string>('Medsense_Sign_In_Role_Technician_Roles', []);
	const assistantRolesSetting = useSetting<string[] | string>('Medsense_Sign_In_Role_Assistant_Roles', []);
	const formId = useId();
	const endDateFieldId = useId();
	const endTimeFieldId = useId();
	const roleFieldId = useId();

	const existingEndTime = useMemo(() => {
		const end = user?.customFields?.medsenseSignInEnd;
		if (typeof end !== 'string') {
			return null;
		}

		const parsed = Date.parse(end);
		if (!Number.isFinite(parsed) || parsed <= Date.now()) {
			return null;
		}

		return new Date(parsed);
	}, [user?.customFields?.medsenseSignInEnd]);
	const existingRole = useMemo(() => {
		const role = user?.customFields?.medsenseSignInRole;
		return typeof role === 'string' ? role : '';
	}, [user?.customFields?.medsenseSignInRole]);
	const [endTime, setEndTime] = useState<Date | null>(() => existingEndTime);
	const [duration, setDuration] = useState<8 | 12 | null>(null);
	const [role, setRole] = useState(() => existingRole);
	const [endTimeError, setEndTimeError] = useState<string | undefined>();
	const [roleError, setRoleError] = useState<string | undefined>();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const normalizeRoleSetting = (rolesSetting: unknown): string[] => {
		if (Array.isArray(rolesSetting)) {
			return rolesSetting.filter((role): role is string => typeof role === 'string' && role.trim().length > 0);
		}

		if (typeof rolesSetting === 'string') {
			return rolesSetting
				.split(',')
				.map((role) => role.trim())
				.filter(Boolean);
		}

		return [];
	};

	const userRoles = Array.isArray(user?.roles) ? user.roles : [];
	const pharmacistRoles = normalizeRoleSetting(pharmacistRolesSetting);
	const technicianRoles = normalizeRoleSetting(technicianRolesSetting);
	const assistantRoles = normalizeRoleSetting(assistantRolesSetting);

	const roleOptions = useMemo<SelectOption[]>(() => {
		const options: SelectOption[] = [['', t('Select')]];

		if (pharmacistRoles.length > 0 && userRoles.some((role) => pharmacistRoles.includes(role))) {
			options.push(['pharmacist', t('Medsense_Role_Pharmacist')]);
		}

		if (technicianRoles.length > 0 && userRoles.some((role) => technicianRoles.includes(role))) {
			options.push(['technician', t('Medsense_Role_Technician')]);
		}

		if (assistantRoles.length > 0 && userRoles.some((role) => assistantRoles.includes(role))) {
			options.push(['assistant', t('Medsense_Role_Assistant')]);
		}

		return options;
	}, [assistantRoles, pharmacistRoles, technicianRoles, t, userRoles]);

	useEffect(() => {
		if (!role) {
			return;
		}

		const isValid = roleOptions.some(([value]) => value === role);
		if (!isValid) {
			setRole('');
		}
	}, [role, roleOptions]);

	const setEndTimeByHours = (hours: 8 | 12) => {
		const next = new Date();
		next.setHours(next.getHours() + hours);
		setEndTime(next);
		setDuration(hours);
		setEndTimeError(undefined);
	};

	const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
		const value = event.currentTarget.value;
		if (!value) {
			setEndTime(null);
			setDuration(null);
			return;
		}

		const [year, month, day] = value.split('-').map(Number);
		const next = endTime ? new Date(endTime) : new Date();
		next.setFullYear(year, month - 1, day);
		setEndTime(next);
		setDuration(null);
		setEndTimeError(undefined);
	};

	const handleTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
		const value = event.currentTarget.value;
		if (!value) {
			setDuration(null);
			return;
		}

		const [hours, minutes] = value.split(':').map(Number);
		const next = endTime ? new Date(endTime) : new Date();
		next.setHours(hours, minutes, 0, 0);
		setEndTime(next);
		setDuration(null);
		setEndTimeError(undefined);
	};

	const dateValue = endTime && !Number.isNaN(endTime.getTime()) ? format(endTime, 'yyyy-MM-dd') : '';
	const timeValue = endTime && !Number.isNaN(endTime.getTime()) ? format(endTime, 'HH:mm') : '';

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setEndTimeError(undefined);
		setRoleError(undefined);

		if (!role) {
			setRoleError(t('Medsense_Sign_In_Role_Required'));
		}

		if (!endTime || Number.isNaN(endTime.getTime())) {
			setEndTimeError(t('Medsense_Sign_In_End_Required'));
		} else if (endTime.getTime() <= Date.now()) {
			setEndTimeError(t('Medsense_Sign_In_End_Invalid'));
		}

		if (!role || !endTime || Number.isNaN(endTime.getTime()) || endTime.getTime() <= Date.now()) {
			return;
		}

		setIsSubmitting(true);
		try {
			await signIn({ role, endTime: endTime.toISOString() });
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSignOut = async () => {
		setIsSubmitting(true);
		try {
			await signOut();
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal aria-labelledby={`${formId}-title`} wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit} {...props} />}>
			<ModalHeader>
				<ModalTitle id={`${formId}-title`}>{t('Medsense_Sign_In')}</ModalTitle>
				<ModalClose tabIndex={-1} onClick={onClose} />
			</ModalHeader>
			<ModalContent mbe={2}>
				<FieldGroup>
					<Field>
						<FieldLabel>{t('Medsense_Sign_In_Duration')}</FieldLabel>
						<FieldRow>
							<ButtonGroup>
								<Button primary={duration === 8} onClick={() => setEndTimeByHours(8)}>
									{t('Medsense_Sign_In_8_Hours')}
								</Button>
								<Button primary={duration === 12} onClick={() => setEndTimeByHours(12)}>
									{t('Medsense_Sign_In_12_Hours')}
								</Button>
							</ButtonGroup>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>{t('Medsense_Sign_In_End_Time')}</FieldLabel>
						<FieldRow>
							<Box display='flex' width='100%'>
								<Box mie={8} flexGrow={1}>
									<InputBox id={endDateFieldId} type='date' value={dateValue} onChange={handleDateChange} />
								</Box>
								<Box flexGrow={1}>
									<InputBox id={endTimeFieldId} type='time' value={timeValue} onChange={handleTimeChange} />
								</Box>
							</Box>
						</FieldRow>
						{endTimeError && (
							<FieldError aria-live='assertive' id={`${endDateFieldId}-error`}>
								{endTimeError}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel htmlFor={roleFieldId}>{t('Medsense_Sign_In_Role')}</FieldLabel>
						<FieldRow>
							<Select
								id={roleFieldId}
								options={roleOptions}
								value={role}
								onChange={(value) => {
									setRole(String(value));
									setRoleError(undefined);
								}}
								aria-invalid={Boolean(roleError)}
							/>
						</FieldRow>
						{roleError && (
							<FieldError aria-live='assertive' id={`${roleFieldId}-error`}>
								{roleError}
							</FieldError>
						)}
					</Field>
				</FieldGroup>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button onClick={handleSignOut} disabled={isSubmitting} danger>
						{t('Medsense_Sign_Out')}
					</Button>
					<Button loading={isSubmitting} type='submit' primary>
						{t('Save')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default memo(MedsenseAgentSignInModal);
