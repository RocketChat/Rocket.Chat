import { route } from 'preact-router';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import type { FieldValues, SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Livechat } from '../../api';
import { Button } from '../../components/Button';
import { Form, FormField, TextInput, SelectInput, CustomFields as CustomFieldsForm } from '../../components/Form';
import type { CustomField } from '../../components/Form/CustomFields';
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

	const topRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	const [atTop, setAtTop] = useState(true);
	const [atBottom, setAtBottom] = useState(false);

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

	// TODO: Move this to its own component
	const callback: IntersectionObserverCallback = (entries) => {
		entries.forEach((entry) => {
			entry.target.id === 'top' && setAtTop(entry.isIntersecting);
			entry.target.id === 'bottom' && setAtBottom(entry.isIntersecting);
		});
	};

	useEffect(() => {
		const observer = new IntersectionObserver(callback, {
			root: document.getElementById('scrollShadow'),
			rootMargin: '0px',
			threshold: 0.1,
		});
		if (topRef.current) {
			observer.observe(topRef.current);
		}
		if (bottomRef.current) {
			observer.observe(bottomRef.current);
		}
		return () => {
			observer.disconnect();
		};
	}, []);

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
			<div id='scrollShadow' className={createClassName(styles, 'scrollShadow', { atTop, atBottom })}>
				<Screen.Content full>
					<Form id='register' onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>)}>
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

						{customFields && <CustomFieldsForm customFields={customFields} loading={loading} control={control} errors={errors} />}
						<div ref={bottomRef} id='bottom' style={{ height: '1px', width: '100%' }} />
					</Form>
				</Screen.Content>
			</div>
			<Screen.Footer>
				<Button
					loading={loading}
					form='register'
					submit
					full
					disabled={!isDirty || !isValid || loading || isSubmitting || Object.keys(errors).length > 0}
				>
					{t('start_chat')}
				</Button>
			</Screen.Footer>
		</Screen>
	);
};

export default Register;
