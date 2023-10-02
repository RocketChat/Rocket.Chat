import type { ComponentChildren, Ref } from 'preact';
import { toChildArray } from 'preact';
import type { JSXInternal } from 'preact/src/jsx';

import { createClassName } from '../../helpers/createClassName';
import styles from './styles.scss';

type HeaderProps = {
	children?: ComponentChildren;
	theme?: {
		color?: string;
		fontColor?: string;
	};
	className?: string;
	post?: ComponentChildren;
	large?: boolean;
	style?: JSXInternal.CSSProperties;
	ref?: Ref<HTMLElement>;
	onClick?: JSXInternal.DOMAttributes<HTMLElement>['onClick'];
};

type HeaderComponentProps = {
	children?: ComponentChildren;
	className?: string;
};

export const Header = ({
	children,
	theme: { color: backgroundColor, fontColor: color } = {},
	className,
	post,
	large,
	style,
	...props
}: HeaderProps) => (
	<header
		className={createClassName(styles, 'header', { large }, [className])}
		style={style || backgroundColor || color ? { ...(style || {}), backgroundColor, color } : undefined}
		{...props}
	>
		{children}
		{post}
	</header>
);

export const Picture = ({ children, className = undefined, ...props }: HeaderComponentProps) => (
	<div className={createClassName(styles, 'header__picture', {}, [className])} {...props}>
		{children}
	</div>
);

export const Content = ({ children, className = undefined, ...props }: HeaderComponentProps) => (
	<div className={createClassName(styles, 'header__content', {}, [className])} {...props}>
		{children}
	</div>
);

export const Title = ({ children, className = undefined, ...props }: HeaderComponentProps) => (
	<div className={createClassName(styles, 'header__title', {}, [className])} {...props}>
		{children}
	</div>
);

export const SubTitle = ({ children, className = undefined, ...props }: HeaderComponentProps) => (
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

export const Actions = ({ children, className = undefined, ...props }: HeaderComponentProps) => (
	<nav className={createClassName(styles, 'header__actions', {}, [className])} {...props}>
		{children}
	</nav>
);

export const Action = ({ children, className = undefined, ...props }: HeaderComponentProps & { onClick?: () => void }) => (
	<button className={createClassName(styles, 'header__action', {}, [className])} {...props}>
		{children}
	</button>
);

export const Post = ({ children, className = undefined, ...props }: HeaderComponentProps) => (
	<div className={createClassName(styles, 'header__post', {}, [className])} {...props}>
		{children}
	</div>
);

export const CustomField = ({ children, className = undefined, ...props }: HeaderComponentProps) => (
	<div className={createClassName(styles, 'header__custom-field', {}, [className])} {...props}>
		{children}
	</div>
);

Header.Picture = Picture;
Header.Content = Content;
Header.Title = Title;
Header.SubTitle = SubTitle;
Header.Actions = Actions;
Header.Action = Action;
Header.Post = Post;
Header.CustomField = CustomField;

export default Header;
