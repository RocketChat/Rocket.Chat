import { route } from 'preact-router';
import { useContext, useEffect, useRef } from 'preact/hooks';
import type { JSXInternal } from 'preact/src/jsx';
import type { FieldValues, SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Livechat } from '../../api';
import { Button } from '../../components/Button';
import { Form, FormField, TextInput, SelectInput, CustomFields as CustomFieldsForm } from '../../components/Form';
import { FormScrollShadow } from '../../components/Form/FormScrollShadow';
import Screen from '../../components/Screen';
import type { Department } from '../../definitions/departments';
import { createClassName } from '../../helpers/createClassName';
import { sortArrayByColumn } from '../../helpers/sortArrayByColumn';
import CustomFields from '../../lib/customFields';
import { validateEmail } from '../../lib/email';
import { parentCall } from '../../lib/parentCall';
import { StoreContext } from '../../store';
import styles from './styles.scss';

// Custom field as in the form payload
type FormPayloadCustomField = { [key: string]: string };

export const Register = ({ screenProps }: { screenProps: { [key: string]: unknown }; path: string }) => {
	const { t } = useTranslation();

	const topRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

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
	} = useContext(StoreContext);

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
		department?: string;
		customFields: FormPayloadCustomField;
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

	const availableDepartments = departments?.filter((dept) => dept.showOnRegistration) as Department[];

	useEffect(() => {
		if (user?._id) {
			route('/');
		}
	}, [user?._id]);

	return (
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
			<FormScrollShadow topRef={topRef} bottomRef={bottomRef}>
				<Screen.Content full>
					<Form
						id='register'
						// The price of using react-hook-form on a preact project ¯\_(ツ)_/¯
						onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>) as unknown as JSXInternal.GenericEventHandler<HTMLFormElement>}
					>
						<div id='top' ref={topRef} style={{ height: '1px', width: '100%' }} />
						<p className={createClassName(styles, 'register__message')}>{message || defaultMessage}</p>

						{hasNameField ? (
							<FormField required label={t('name')} error={errors.name?.message?.toString()}>
								<Controller
									name='name'
									control={control}
									defaultValue={guestName}
									rules={{ required: true }}
									render={({ field }) => (
										<TextInput placeholder={t('insert_your_field_here', { field: t('name') })} disabled={loading} {...field} />
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
										<TextInput placeholder={t('insert_your_field_here', { field: t('email') })} disabled={loading} {...field} />
									)}
								/>
							</FormField>
						) : null}

						{availableDepartments.length ? (
							<FormField label={t('i_need_help_with')} error={errors.department?.message?.toString()}>
								<Controller
									name='department'
									control={control}
									defaultValue={getDepartmentDefault()}
									render={({ field }) => (
										<SelectInput
											options={sortArrayByColumn(availableDepartments, 'name').map(({ _id, name }: { _id: string; name: string }) => ({
												value: _id,
												label: name,
											}))}
											placeholder={t('choose_an_option')}
											disabled={loading}
											{...field}
										/>
									)}
								/>
							</FormField>
						) : null}

						{customFields && <CustomFieldsForm customFields={customFields} loading={loading} control={control} errors={errors} />}
						<div ref={bottomRef} id='bottom' style={{ height: '1px', width: '100%' }} />
					</Form>
				</Screen.Content>
			</FormScrollShadow>
			<Screen.Footer>
				<Button loading={loading} form='register' submit full disabled={!isDirty || !isValid || loading || isSubmitting}>
					{t('start_chat')}
				</Button>
			</Screen.Footer>
		</Screen>
	);
};

export default Register;
