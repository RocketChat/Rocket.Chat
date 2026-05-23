import type { ComponentChildren } from 'preact';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

type HeaderCustomFieldProps = {
	children?: ComponentChildren;
	className?: string;
};

const HeaderCustomField = ({ children, className = undefined, ...props }: HeaderCustomFieldProps) => (
	<div className={createClassName(styles, 'header__custom-field', {}, [className])} {...props}>
		{children}
	</div>
);

export default HeaderCustomField;
