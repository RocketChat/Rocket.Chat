import type { HTMLAttributes, RefAttributes } from 'react';

type DefaultSidebarProps = HTMLAttributes<HTMLElement> &
	RefAttributes<HTMLElement> & {
		variant?: 'default';
		collapsed?: boolean;
	};

type SidepanelVariantProps = HTMLAttributes<HTMLDivElement> &
	RefAttributes<HTMLDivElement> & {
		variant: 'sidepanel';
		collapsed?: never;
	};

export type SidebarProps = DefaultSidebarProps | SidepanelVariantProps;

export function Sidebar(props: SidebarProps) {
	if (props.variant === 'sidepanel') {
		const { variant, className, ...rest } = props;

		return <div className={['rcx-sidepanel', className].filter(Boolean).join(' ')} {...rest} />;
	}

	const { variant, collapsed, className, ...rest } = props;

	return (
		<nav
			className={['rcx-box rcx-box--full rcx-sidebar', 'rcx-box--animated', collapsed && 'rcx-sidebar--collapsed', className]
				.filter(Boolean)
				.join(' ')}
			{...rest}
		/>
	);
}
