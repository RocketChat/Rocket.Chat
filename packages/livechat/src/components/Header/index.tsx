import { toChildArray } from 'preact';
import type { FunctionComponent } from 'preact';
import type { JSXInternal } from 'preact/src/jsx';

import { createClassName } from '../helpers';
import styles from './styles.scss';

type HeaderProps = {
	className?: string;
	post: FunctionComponent;
	large?: boolean;
};

export const Header: FunctionComponent<HeaderProps> = ({ children, className, post, large }) => (
	<header className={createClassName(styles, 'header', { large }, [className])}>
		{children}
		{post}
	</header>
);

export const HeaderPicture: FunctionComponent<{ className?: string }> = ({ children, className }) => (
	<div className={createClassName(styles, 'header__picture', {}, [className])}>{children}</div>
);

export const HeaderContent: FunctionComponent<{ className?: string }> = ({ children, className }) => (
	<div className={createClassName(styles, 'header__content', {}, [className])}>{children}</div>
);

export const HeaderTitle: FunctionComponent<{ className?: string }> = ({ children, className }) => (
	<div className={createClassName(styles, 'header__title', {}, [className])}>{children}</div>
);

export const HeaderSubTitle: FunctionComponent<{ className?: string }> = ({ children, className }) => (
	<div
		className={createClassName(
			styles,
			'header__subtitle',
			{
				children: toChildArray(children).length > 0,
			},
			[className],
		)}
	>
		{children}
	</div>
);

export const HeaderActions: FunctionComponent<{ className?: string }> = ({ children, className }) => (
	<nav className={createClassName(styles, 'header__actions', {}, [className])}>{children}</nav>
);

export const HeaderAction: FunctionComponent<{ className?: string; onClick?: JSXInternal.MouseEventHandler<HTMLButtonElement> }> = ({
	children,
	className,
	onClick,
}) => (
	<button onClick={onClick} className={createClassName(styles, 'header__action', {}, [className])}>
		{children}
	</button>
);

export const HeaderPost: FunctionComponent<{ className?: string }> = ({ children, className }) => (
	<div className={createClassName(styles, 'header__post', {}, [className])}>{children}</div>
);

export const HeaderCustomField: FunctionComponent<{ className?: string }> = ({ children, className }) => (
	<div className={createClassName(styles, 'header__custom-field', {}, [className])}>{children}</div>
);
