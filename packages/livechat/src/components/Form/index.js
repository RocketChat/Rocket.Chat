import i18next from 'i18next';

import { validateEmail } from '../../lib/email';
import { createClassName, MemoizedComponent } from '../helpers';
import styles from './styles.scss';

export class Form extends MemoizedComponent {
	static defaultHandleSubmit = (event) => {
		event.preventDefault();
	};

	render = ({ onSubmit, className, style = {}, children }) => (
		<form
			noValidate
			onSubmit={onSubmit || Form.defaultHandleSubmit}
			className={createClassName(styles, 'form', {}, [className])}
			style={style}
		>
			{children}
		</form>
	);
}

export const Validations = {
	nonEmpty: ({ value }) => (!value ? i18next.t('field_required') : undefined),
	email: ({ value }) => (validateEmail(String(value).toLowerCase(), { style: 'rfc' }) ? null : i18next.t('invalid_email')),
	custom: ({ value, pattern }) => (new RegExp(pattern, 'i').test(String(value)) ? null : i18next.t('invalid_value')),
};


export { FormField } from './FormField';
export { TextInput } from './TextInput';
export { PasswordInput } from './PasswordInput';
export { SelectInput } from './SelectInput';
