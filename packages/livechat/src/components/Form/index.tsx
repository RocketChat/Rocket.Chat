import i18next from 'i18next';
import type { ComponentChildren } from 'preact';
import type { JSXInternal } from 'preact/src/jsx';

type FormProps = {
	onSubmit?: JSXInternal.GenericEventHandler<HTMLFormElement>;
	className?: string;
	style?: JSXInternal.CSSProperties;
	id?: string;
	children?: ComponentChildren;
};

export const Form = ({ onSubmit, className, style = {}, id, children }: FormProps) => (
	<form noValidate id={id} onSubmit={onSubmit} className={className} style={style}>
		{children}
	</form>
);

export const Validations = {
	nonEmpty: ({ value }: { value: string }) => (!value.trim() ? i18next.t('field_required') : undefined),
	custom: ({ value, pattern }: { value: string; pattern: string }) =>
		new RegExp(pattern, 'i').test(String(value)) ? null : i18next.t('invalid_value'),
};

export { FormField } from './FormField';
export { TextInput } from './TextInput';
export { MultilineTextInput } from './MultilineTextInput';
export { PasswordInput } from './PasswordInput';
export { SelectInput } from './SelectInput';
export { CustomFields } from './CustomFields';
