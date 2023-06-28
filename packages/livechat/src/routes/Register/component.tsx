import type { Control, FieldErrors, FieldValues } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { ButtonGroup } from '../../components/ButtonGroup';
import { Form, FormField, TextInput, SelectInput } from '../../components/Form';
import Screen from '../../components/Screen';
import { createClassName, sortArrayByColumn } from '../../components/helpers';
import { validateEmail } from '../../lib/email';
import styles from './styles.scss';

// const getDefaultDepartment = (departments = []) => (departments.length === 1 && departments[0]._id) || '';

type customField = {
	_id: string;
	required?: boolean;
	label?: string;
	type: string;
	options?: string[];
	defaultValue?: string;
	regexp?: RegExp;
};

type renderCustomFieldsProps = {
	customFields: customField[];
	loading: boolean;
	control: Control;
	errors: FieldErrors<FieldValues>;
};

const renderCustomFields = ({ customFields, loading, control, errors }: renderCustomFieldsProps) =>
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

// const validations = {
// 	name: [Validations.nonEmpty],
// 	email: [Validations.nonEmpty, Validations.email],
// 	department: [],
// };

// const getValidableFields = (state) =>
// 	Object.keys(validations)
// 		.map((fieldName) => (state[fieldName] ? { fieldName, ...state[fieldName] } : null))
// 		.filter(Boolean);

// const validate = (props, { _id, name, value, regexp: pattern }) => {
// 	const validation = validations[name] || getCustomValidations(props)[_id];
// 	return validation.reduce((error, validation) => error || validation({ value, pattern }), undefined);
// };

// const getDefaultState = (props) => {
// 	const { hasNameField, hasEmailField, hasDepartmentField, departments, customFields = [] } = props;

// 	for (const { fieldName: name, value, regexp } of getValidableFields(state)) {
// 		const error = validate(props, { name, value, regexp });
// 		state = {
// 			...state,
// 			[name]: {
// 				...state[name],
// 				value,
// 				error,
// 				showError: false,
// 			},
// 		};
// 	}

// 	return state;
// };

// ref={ref}
// theme={{
// 	color: customColor || color,
// 	fontColor: customFontColor,
// 	iconColor: customIconColor,
// 	title: customTitle,
// }}
// title={customTitle || title}
// message={message}
// hasNameField={hasNameField}
// hasEmailField={hasEmailField}
// hasDepartmentField={departments && departments.some((dept) => dept.showOnRegistration)}
// departments={departments.filter((dept) => dept.showOnRegistration)}
// nameDefault={guestName}
// emailDefault={guestEmail}
// guestDepartment={guestDepartment}
// loading={loading}
// token={token}
// dispatch={dispatch}
// user={user}
// customFields={customFields}

type RegisterProps = {
	title: string;
	color: string;
	message: string;
	loading: boolean;
	departments: unknown[];
	customFields: customField[];
	onSubmit: (values: unknown) => void;
	departmentDefault: unknown;
	emailDefault: string;
	nameDefault: string;
	hasDepartmentField: boolean;
	hasEmailField: boolean;
	hasNameField: boolean;
};

const Register = ({
	title,
	color,
	message,
	loading,
	departments,
	customFields,
	onSubmit,
	emailDefault,
	departmentDefault,
	nameDefault,
	hasDepartmentField,
	hasEmailField,
	hasNameField,
}: RegisterProps) => {
	const { t } = useTranslation();

	// constructor(props) {
	// 	super(props);
	// 	this.state = getDefaultState(props);
	// }

	// const getDerivedStateFromProps(nextProps, state) {
	// 	const { hasNameField, hasEmailField, hasDepartmentField, nameDefault, emailDefault, departmentDefault } = nextProps;
	// 	const { name, email, department } = state;
	// 	const newState = {};

	// 	if (hasNameField && nameDefault && nameDefault !== name?.value) {
	// 		const error = validate(this.props, { name: 'name', value: nameDefault, regexp: name?.regexp });
	// 		newState.name = { ...name, value: nameDefault, error };
	// 	}

	// 	if (hasEmailField && emailDefault && emailDefault !== email?.value) {
	// 		const error = validate(this.props, { name: 'email', value: emailDefault, regexp: email?.regexp });
	// 		newState.email = { ...email, value: emailDefault, error };
	// 	}

	// 	if (hasDepartmentField && departmentDefault && departmentDefault !== department?.value) {
	// 		const error = validate(this.props, { name: 'department', value: departmentDefault, regexp: department?.regexp });
	// 		newState.department = { ...department, value: departmentDefault, error };
	// 	}

	// 	return newState;
	// }

	const {
		// register,
		handleSubmit,
		// watch,
		formState: { errors, isDirty, isValid, isSubmitting },
		setError,
		control,
		// reset,
	} = useForm({ mode: 'onChange' });

	// const onSubmit = (data, e) => console.log(data, e);

	// state { name, email, department, ...state }

	const defaultTitle = t('need_help');
	const defaultMessage = t('please_tell_us_some_information_to_start_the_chat');

	// const valid = getValidableFields(this.state).every(({ error } = {}) => !error);

	console.log(errors, isDirty, isValid);

	console.log(validateEmail('benes@a.c', { style: 'rfc' }) || t('invalid_email'));

	return (
		<Screen color={color} title={title || defaultTitle} className={createClassName(styles, 'register')}>
			<Screen.Content>
				<p className={createClassName(styles, 'register__message')}>{message || defaultMessage}</p>

				<Form id='register'>
					{hasNameField ? (
						<FormField required label={t('name')} error={errors.name?.message?.toString()}>
							<Controller
								name='name'
								control={control}
								defaultValue={nameDefault}
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
								defaultValue={emailDefault}
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

					{hasDepartmentField ? (
						<FormField label={t('i_need_help_with')} error={errors.department?.message?.toString()}>
							<Controller
								name='department'
								control={control}
								defaultValue={departmentDefault}
								// rules={{ required: true }}
								render={({ field }) => (
									<SelectInput
										name='department'
										options={sortArrayByColumn(departments, 'name').map(({ _id, name }) => ({ value: _id, label: name }))}
										placeholder={t('choose_an_option')}
										disabled={loading}
										field={field}
									/>
								)}
							/>
						</FormField>
					) : null}

					{customFields && renderCustomFields({ customFields, loading, control, errors })}
				</Form>
			</Screen.Content>
			<Screen.Footer>
				<ButtonGroup>
					<Button
						onClick={handleSubmit(onSubmit)}
						loading={loading}
						disabled={!isDirty || !isValid || loading || isSubmitting || Object.keys(errors).length > 0}
					>
						{t('start_chat')}
					</Button>
				</ButtonGroup>
			</Screen.Footer>
		</Screen>
	);
};

export default Register;
