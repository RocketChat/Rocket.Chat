import type { ReactNode, MouseEvent, AllHTMLAttributes, RefAttributes } from 'react';
import { memo } from 'react';

import { prevent } from '../../helpers/prevent';
import type { BoxProps } from '../Box';
import type { IconProps } from '../Icon';
import OptionAvatar from './OptionAvatar';
import OptionColumn from './OptionColumn';
import OptionContent from './OptionContent';
import OptionIcon from './OptionIcon';

export type OptionProps<TLabel = ReactNode> = RefAttributes<Element> & {
	is?: BoxProps['is'];
	id?: string;
	children?: ReactNode;
	label?: TLabel;
	focus?: boolean;
	selected?: boolean;
	className?: BoxProps['className'];
	icon?: IconProps['name'];
	gap?: boolean;
	avatar?: ReactNode;
	title?: string;
	disabled?: boolean;
	value?: string | number;
	variant?: 'danger' | 'success' | 'warning' | 'primary';
	onClick?: (event: MouseEvent<HTMLElement>) => void;
	description?: ReactNode;
} & Omit<
		AllHTMLAttributes<HTMLElement>,
		| 'is'
		| 'id'
		| 'children'
		| 'label'
		| 'selected'
		| 'className'
		| 'ref'
		| 'icon'
		| 'gap'
		| 'avatar'
		| 'title'
		| 'disabled'
		| 'value'
		| 'variant'
		| 'onClick'
		| 'description'
	>;

/**
 * The generic `Option` item of options. Can be freely used or inside the `Options` as well.
 */
function Option<TLabel = ReactNode>({
	is: Tag = 'li',
	id,
	children,
	label,
	focus,
	selected,
	className,
	icon,
	gap,
	avatar,
	title,
	disabled,
	variant,
	onClick,
	description,
	...props
}: OptionProps<TLabel>) {
	return (
		<Tag
			{...props}
			key={id}
			id={id}
			aria-selected={!!selected}
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
			<div className={['rcx-option__wrapper', !!description && 'rcx-option__wrapper--align-top'].filter(Boolean).join(' ')}>
				{avatar && <OptionAvatar>{avatar}</OptionAvatar>}
				{icon && <OptionIcon name={icon} />}
				{gap && <OptionColumn />}
				{label && <OptionContent>{label as ReactNode}</OptionContent>}
				{label !== children && children}
			</div>
		</Tag>
	);
}

export default memo(Option);
