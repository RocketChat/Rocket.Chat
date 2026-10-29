import type { ComponentChildren, Ref, JSX as JSXInternal } from 'preact';
import type { MouseEventHandler } from 'preact/compat';

import styles from './styles.scss';
import type { Theme } from '../../Theme';
import { createClassName } from '../../helpers/createClassName';

export type HeaderProps = {
	children?: ComponentChildren;
	theme?: Partial<Theme>;
	className?: string;
	post?: ComponentChildren;
	large?: boolean;
	style?: JSXInternal.CSSProperties;
	ref?: Ref<HTMLElement>;
	onClick?: MouseEventHandler<HTMLElement>;
};

const Header = ({
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

export default Header;
