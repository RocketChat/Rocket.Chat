import type { FunctionalComponent } from 'preact';
import { useContext, useEffect, useMemo, useRef } from 'preact/hooks';
import type { JSXInternal } from 'preact/src/jsx';
import { route } from 'preact-router';
import type { FieldValues, SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import styles from './styles.scss';
import { Livechat } from '../../api';
import { Button } from '../../components/Button';
import { Form, FormField, TextInput, SelectInput, CustomFields as CustomFieldsForm } from '../../components/Form';
import { FormScrollShadow } from '../../components/Form/FormScrollShadow';
import Screen from '../../components/Screen';
import { createClassName } from '../../helpers/createClassName';
import { sortArrayByColumn } from '../../helpers/sortArrayByColumn';
import CustomFields from '../../lib/customFields';
import { validateEmail } from '../../lib/email';
import { parentCall } from '../../lib/parentCall';
import Triggers from '../../lib/triggers';
import { StoreContext } from '../../store';
import type { StoreState } from '../../store';

// Custom field as in the form payload
type FormPayloadCustomField = { [key: string]: string };

export type RegisterFormValues = { name: string; email: string; department?: string; [key: string]: any };

export const Register: FunctionalComponent<{ path: string }> = () => {
	const { t } = useTranslation();

	const topRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	const {
		config: {
			departments = [],
			messages: { registrationFormMessage: message },
			settings: { nameFieldRegistrationForm: hasNameField, emailFieldRegistrationForm: hasEmailField },
			theme: { title },
			customFields = [],
		},

		iframe: { defaultDepartment, guest: { name: guestName = undefined, email: guestEmail = undefined } = {} },

		loading = false,
		token,
		dispatch,
		user,
	} = useContext(StoreContext);

	const {
		handleSubmit,
		formState: { errors, isDirty, isValid, isSubmitting },
		control,
		resetField,
	} = useForm<RegisterFormValues>({
		mode: 'onChange',
	});

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
		const guestDepartment = department || defaultDepartment;
		const fields = {
			name,
			email,
			...(guestDepartment && { department: guestDepartment }),
		};

		dispatch({ loading: true });

		try {
			const { visitor: user } = await Livechat.grantVisitor({ visitor: { ...fields, token } });
			await dispatch({
				user,
				...(user.contactManager && { agent: user.contactManager }),
			} as Omit<StoreState['user'], 'ts'>);

			parentCall('callback', 'pre-chat-form-submit', fields);
			Triggers.callbacks?.emit('chat-visitor-registered');
			registerCustomFields(customFields);
		} finally {
			dispatch({ loading: false });
		}
	};

	const defaultDepartmentId = useMemo(
		() => departments.find((dept) => dept.name === defaultDepartment || dept._id === defaultDepartment)?._id,
		[defaultDepartment, departments],
	);

	useEffect(() => {
		resetField('department', { defaultValue: defaultDepartmentId });
	}, [departments, defaultDepartment, resetField, defaultDepartmentId]);

	const availableDepartments = departments.filter((dept) => dept.showOnRegistration);

	useEffect(() => {
		if (user?._id) {
			route('/');
		}
	}, [user?._id]);

	return (
		<Screen title={title || defaultTitle} className={createClassName(styles, 'register')}>
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
									defaultValue={defaultDepartmentId}
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
