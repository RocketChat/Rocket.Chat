import { cloneElement } from 'preact';
import type { ComponentChildren, JSX as JSXInternal } from 'preact';

import styles from './styles.module.scss';
import { createClassName } from '../../../helpers/createClassName';

export type FormFieldProps = {
	required?: boolean;
	label?: string;
	description?: string;
	error?: string;
	errorId?: string;
	className?: string;
	style?: JSXInternal.CSSProperties;
	children: ComponentChildren;
};

export const FormField = ({ required, label, description, error, errorId, className, style = {}, children }: FormFieldProps) => (
	<div className={createClassName(styles, 'form-field', { required, error: !!error }, [className])} style={style}>
		<label className={createClassName(styles, 'form-field__label-wrapper')}>
			{label ? <span className={createClassName(styles, 'form-field__label')}>{label}</span> : null}
			<span className={createClassName(styles, 'form-field__input')}>
				{error ? (Array.isArray(children) ? children : [children]).map((child) => cloneElement(child, { error: !!error })) : children}
			</span>
		</label>
		<small id={error ? errorId : undefined} className={createClassName(styles, 'form-field__description')}>
			{error || description}
		</small>
	</div>
);
