import i18next from 'i18next';

import { MemoizedComponent } from '../../helpers/MemoizedComponent';
import { validateEmail } from '../../lib/email';

export class Form extends MemoizedComponent {
	static defaultHandleSubmit = (event) => {
		event.preventDefault();
	};

	render = ({ onSubmit, className, style = {}, children }) => (
		<form noValidate onSubmit={onSubmit || Form.defaultHandleSubmit} className={className} style={style}>
			{children}
		</form>
	);
}

export const Validations = {
	nonEmpty: ({ value }) => (!value.trim() ? i18next.t('field_required') : undefined),
	email: ({ value }) => (validateEmail(String(value).toLowerCase(), { style: 'rfc' }) ? null : i18next.t('invalid_email')),
	custom: ({ value, pattern }) => (new RegExp(pattern, 'i').test(String(value)) ? null : i18next.t('invalid_value')),
};

export { FormField } from './FormField';
export { TextInput } from './TextInput';
export { PasswordInput } from './PasswordInput';
export { SelectInput } from './SelectInput';
