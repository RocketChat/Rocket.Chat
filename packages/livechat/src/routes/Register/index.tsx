import { route } from 'preact-router';
import { useContext, useEffect } from 'preact/hooks';
import type { Control, FieldErrors, FieldValues, SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Livechat } from '../../api';
import { Button } from '../../components/Button';
import { ButtonGroup } from '../../components/ButtonGroup';
import { Form, FormField, TextInput, SelectInput } from '../../components/Form';
import Screen from '../../components/Screen';
import { createClassName, sortArrayByColumn } from '../../components/helpers';
import CustomFields from '../../lib/customFields';
import { validateEmail } from '../../lib/email';
import { parentCall } from '../../lib/parentCall';
import { StoreContext } from '../../store';
import styles from './styles.scss';

// TODO: Properly type departments in livechat
type department = {
	_id: string;
	name: string;
	[key: string]: unknown;
};

type CustomField = {
	_id: string;
	required?: boolean;
	label?: string;
	type: string;
	options?: string[];
	defaultValue?: string;
	regexp?: RegExp;
};

type RenderCustomFieldsProps = {
	customFields: CustomField[];
	loading: boolean;
	control: Control;
	errors: FieldErrors<FieldValues>;
};

const renderCustomFields = ({ customFields, loading, control, errors }: RenderCustomFieldsProps) =>
	customFields.map(({ _id, required = false, label, type, options, regexp, defaultValue }) => {
		const { t } = useTranslation();
		switch (type) {
			case 'input':
				return (
					<FormField label={label} required={required} key={_id} error={errors?.[_id]?.message?.toString()}>
						<Controller
							name={_id}
							control={control}
							defaultValue={defaultValue}
							rules={{
								required,
								...(regexp && {
									pattern: {
										value: regexp,
										message: t('invalid', { field: label }),
									},
								}),
							}}
							render={({ field }) => (
								<TextInput name={_id} placeholder={t('insert_your_field_here', { field: label })} disabled={loading} field={field} />
							)}
						/>
					</FormField>
				);
			// TODO: typeguards for different types of custom fields
			case 'select':
				return (
					<FormField label={label} required={required} key={_id} error={errors?.[_id]?.message?.toString()}>
						<Controller
							name={_id}
							control={control}
							rules={{ required }}
							defaultValue={defaultValue}
							render={({ field }) => (
								<SelectInput
									name={_id}
									placeholder={t('choose_an_option')}
									options={(options as string[])?.map((option: string) => ({ value: option, label: option }))}
									disabled={loading}
									field={field}
								/>
							)}
						/>
					</FormField>
				);
		}
		return null;
	});

type ContextReturn = {
	config: {
		departments?: department[];
		messages: {
			registrationFormMessage?: string;
		};
		settings: {
			nameFieldRegistrationForm?: boolean;
			emailFieldRegistrationForm?: boolean;
		};
		theme: {
			title?: string;
			color?: string;
		};
		customFields?: CustomField[];
	};
	iframe: {
		guest: {
			department?: string;
			name?: string;
			email?: string;
		};
		theme: {
			color?: string;
			fontColor?: string;
			iconColor?: string;
			title?: string;
		};
	};
	loading: boolean;
	token: string;
	dispatch: (args: unknown) => void;
	user?: { _id: string; [key: string]: unknown };
};
export const Register = ({ screenProps }: { screenProps: { [key: string]: unknown } }) => {
	const { t } = useTranslation();

	const {
		handleSubmit,
		formState: { errors, isDirty, isValid, isSubmitting },
		control,
	} = useForm({ mode: 'onChange' });

	const {
		config: {
			departments = [],
			messages: { registrationFormMessage: message },
			settings: { nameFieldRegistrationForm: hasNameField, emailFieldRegistrationForm: hasEmailField },
			theme: { title, color },
			customFields = [],
		},
		iframe: {
			guest: { department: guestDepartment, name: guestName, email: guestEmail },
			theme: { color: customColor, fontColor: customFontColor, iconColor: customIconColor, title: customTitle },
		},
		loading = false,
		token,
		dispatch,
		user,
	}: ContextReturn = useContext(StoreContext);

	const defaultTitle = t('need_help');
	const defaultMessage = t('please_tell_us_some_information_to_start_the_chat');

	const registerCustomFields = (customFields = {}) => {
		Object.entries(customFields).forEach(([key, value]) => {
			if (!value || value === '') {
				return;
			}

			CustomFields.setCustomField(key, value, true);
		});
	};

	const onSubmit = async ({
		name,
		email,
		department,
		...customFields
	}: {
		name: string;
		email: string;
		department: string;
		customFields: { [key: string]: string };
	}) => {
		const fields = {
			name,
			email,
			...(department && { department }),
		};

		await dispatch({ loading: true, department });
		try {
			const { visitor: user } = await Livechat.grantVisitor({ visitor: { ...fields, token } });
			await dispatch({ user });
			parentCall('callback', ['pre-chat-form-submit', fields]);
			registerCustomFields(customFields);
		} finally {
			await dispatch({ loading: false });
		}
	};

	const getDepartmentDefault = () => {
		if (departments?.some((dept) => dept._id === guestDepartment)) {
			return guestDepartment;
		}
	};

	useEffect(() => {
		if (user?._id) {
			route('/');
		}
	}, [user?._id]);

	return (
		<Form id='register' onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>)}>
			<Screen
				theme={{
					color: customColor || color,
					fontColor: customFontColor,
					iconColor: customIconColor,
					title: customTitle,
				}}
				title={title || defaultTitle}
				className={createClassName(styles, 'register')}
				{...screenProps}
			>
				<Screen.Content>
					<p className={createClassName(styles, 'register__message')}>{message || defaultMessage}</p>

					{hasNameField ? (
						<FormField required label={t('name')} error={errors.name?.message?.toString()}>
							<Controller
								name='name'
								control={control}
								defaultValue={guestName}
								rules={{ required: true }}
								render={({ field }) => (
									<TextInput
										name='name'
										placeholder={t('insert_your_field_here', { field: t('name') })}
										disabled={loading}
										field={field}
										// onInput={(target: HTMLInputElement) => setName(target.value)}
									/>
								)}
							/>
						</FormField>
					) : null}

					{hasEmailField ? (
						<FormField required label={t('email')} error={errors.email?.message?.toString()}>
							<Controller
								name='email'
								control={control}
								defaultValue={guestEmail}
								rules={{
									required: true,
									validate: { checkEmail: (value) => validateEmail(value, { style: 'rfc' }) || t('invalid_email') },
								}}
								render={({ field }) => (
									<TextInput
										name='email'
										placeholder={t('insert_your_field_here', { field: t('email') })}
										disabled={loading}
										field={field}
									/>
								)}
							/>
						</FormField>
					) : null}

					{departments?.some((dept) => dept.showOnRegistration) ? (
						<FormField label={t('i_need_help_with')} error={errors.department?.message?.toString()}>
							<Controller
								name='department'
								control={control}
								defaultValue={getDepartmentDefault()}
								// rules={{ required: true }}
								render={({ field }) => (
									<SelectInput
										name='department'
										options={sortArrayByColumn(departments, 'name').map(({ _id, name }: { _id: string; name: string }) => ({
											value: _id,
											label: name,
										}))}
										placeholder={t('choose_an_option')}
										disabled={loading}
										field={field}
									/>
								)}
							/>
						</FormField>
					) : null}

					{customFields && renderCustomFields({ customFields, loading, control, errors })}
				</Screen.Content>
				<Screen.Footer>
					<ButtonGroup>
						<Button loading={loading} disabled={!isDirty || !isValid || loading || isSubmitting || Object.keys(errors).length > 0} submit>
							{t('start_chat')}
						</Button>
					</ButtonGroup>
				</Screen.Footer>
			</Screen>
		</Form>
	);
};

export default Register;
