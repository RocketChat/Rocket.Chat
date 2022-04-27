import { cloneElement } from 'preact';

import { createClassName } from '../../helpers';
import styles from './styles.scss';


export const FormField = ({
	required,
	label,
	description,
	error,
	className,
	style = {},
	children,
}) => (
	<div
		className={createClassName(styles, 'form-field', { required, error: !!error }, [className])}
		style={style}
	>
		<label className={createClassName(styles, 'form-field__label-wrapper')}>
			{label
				? <span className={createClassName(styles, 'form-field__label')}>{label}</span>
				: null}
			<span className={createClassName(styles, 'form-field__input')}>
				{error
					? (Array.isArray(children) ? children : [children])
						.map((child) => cloneElement(child, { error: !!error }))
					: children}
			</span>
		</label>
		<small className={createClassName(styles, 'form-field__description')}>
			{error || description}
		</small>
	</div>
);
