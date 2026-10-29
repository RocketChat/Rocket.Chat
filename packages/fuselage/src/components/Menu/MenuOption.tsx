import type { ReactNode, MouseEvent, AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { memo } from 'react';

import { prevent } from '../../helpers/prevent';

export type MenuOptionProps = RefAttributes<Element> & {
	is?: ElementType;
	id?: string;
	children?: ReactNode;
	focus?: boolean;
	selected?: boolean;
	className?: string;
	title?: string;
	disabled?: boolean;
	value?: string;
	variant?: 'danger' | 'success' | 'warning' | 'primary';
	onClick?: (event: MouseEvent<HTMLElement>) => void;
	description?: ReactNode;
} & Omit<AllHTMLAttributes<HTMLElement>, 'label'>;

function MenuOption({
	is: Tag = 'li',
	id,
	children,
	focus,
	selected,
	className,
	title,
	disabled,
	variant,
	onClick,
	...props
}: MenuOptionProps) {
	return (
		<Tag
			{...props}
			key={id}
			id={id}
			aria-disabled={!!disabled}
			title={title}
			onClick={(e: MouseEvent<HTMLDivElement>) => {
				if (disabled) {
					prevent(e);
					return;
				}
				onClick?.(e);
			}}
			className={[
				'rcx-option',
				className,
				focus && 'rcx-option--focus',
				selected && 'rcx-option--selected',
				disabled && 'rcx-option--disabled',
				variant && `rcx-option--${variant}`,
			]
				.filter(Boolean)
				.join(' ')}
		>
			{children}
		</Tag>
	);
}

export default memo(MenuOption);
