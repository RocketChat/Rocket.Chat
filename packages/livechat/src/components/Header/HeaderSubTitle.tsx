import type { ComponentChildren } from 'preact';
import { toChildArray } from 'preact';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

type HeaderSubTitleProps = {
	children?: ComponentChildren;
	className?: string;
};

const HeaderSubTitle = ({ children, className = undefined, ...props }: HeaderSubTitleProps) => (
	<div
		className={createClassName(
			styles,
			'header__subtitle',
			{
				children: toChildArray(children).length > 0,
			},
			[className],
		)}
		{...props}
	>
		{children}
	</div>
);

export default HeaderSubTitle;
