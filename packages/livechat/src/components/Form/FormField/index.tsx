import type { ComponentChildren } from 'preact';
import { cloneElement } from 'preact';
import type { JSXInternal } from 'preact/src/jsx';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

type FormFieldProps = {
	required?: boolean;
	label?: string;
	description?: string;
	error?: string;
	className?: string;
	style?: JSXInternal.CSSProperties;
	children: ComponentChildren;
};

export const FormField = ({ required, label, description, error, className, style = {}, children }: FormFieldProps) => (
	<div className={createClassName(styles, 'form-field', { required, error: !!error }, [className])} style={style}>
		<label className={createClassName(styles, 'form-field__label-wrapper')}>
			{label ? <span className={createClassName(styles, 'form-field__label')}>{label}</span> : null}
			<span className={createClassName(styles, 'form-field__input')}>
				{error ? (Array.isArray(children) ? children : [children]).map((child) => cloneElement(child, { error: !!error })) : children}
			</span>
		</label>
		<small className={createClassName(styles, 'form-field__description')}>{error || description}</small>
	</div>
);
