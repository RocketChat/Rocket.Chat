import type { ReactNode, MouseEvent, AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { memo } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';
import { prevent } from '../../helpers/prevent';
import { useArrayLikeClassNameProp } from '../../hooks/useArrayLikeClassNameProp';
import { Icon, type IconProps } from '../Icon';
import { Item, ItemContent, ItemIcon, ItemMedia, ItemTitle } from '../Item';

export type OptionProps<TLabel = ReactNode> = RefAttributes<HTMLElement> & {
	is?: ElementType;
	id?: string;
	/** Content after the `label`, such as an `OptionInput` or an `OptionMenu`. Not repeated when it is the `label` itself. */
	children?: ReactNode;
	/** The option's text, shown as its title. */
	label?: TLabel;
	/** Shows the hover surface for a virtual cursor, such as the option the arrow keys reached in a listbox. */
	focus?: boolean;
	/** Shows the focus ring on the option when a script moves focus to it, such as a combobox's active descendant. */
	focusVisible?: boolean;
	selected?: boolean;
	className?: string;
	/** Leading icon. */
	icon?: IconProps['name'];
	/** Names what the `icon` conveys, such as "Federated". Without it, the icon is decorative. */
	iconLabel?: string;
	/** Leaves an empty icon-wide slot, so the label lines up with options that have an `icon`. */
	gap?: boolean;
	/** Leading avatar, before the icon. */
	avatar?: ReactNode;
	title?: string;
	disabled?: boolean;
	value?: string | number;
	/** Colors the option for the kind of choice it is, such as `danger` for a destructive one. */
	variant?: 'danger' | 'success' | 'warning' | 'primary';
	onClick?: (event: MouseEvent<HTMLElement>) => void;
	description?: ReactNode;
} & Omit<
		AllHTMLAttributes<HTMLElement>,
		| 'is'
		| 'id'
		| 'children'
		| 'label'
		| 'focusVisible'
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
 * A choice in a list, such as a select's or an autocomplete's, inside `Options` or any other listbox.
 *
 * It renders an `Item` row, so its content can also be composed from `Item` parts.
 */
function Option<TLabel = ReactNode>({
	ref,
	is = 'li',
	children,
	label,
	focus,
	focusVisible,
	selected,
	className,
	icon,
	iconLabel,
	gap,
	avatar,
	disabled,
	variant,
	onClick,
	description,
	...props
}: OptionProps<TLabel>) {
	const { className: normalizedClassName } = useArrayLikeClassNameProp({
		className,
	});

	return (
		<Item
			{...props}
			ref={ref}
			is={is}
			inset='md'
			focused={focus}
			focusVisible={focusVisible}
			selected={selected}
			disabled={disabled}
			variant={variant === 'danger' ? 'danger' : undefined}
			aria-selected={!!selected}
			aria-disabled={!!disabled}
			onClickCapture={disabled ? prevent : undefined}
			onClick={(event: MouseEvent<HTMLElement>) => onClick?.(event)}
			className={cx(
				cxx('rcx-option')(
					{
						'focus': !!focus,
						'selected': !!selected,
						'disabled': !!disabled,
						'align-top': !!description,
					},
					variant,
				),
				normalizedClassName,
			)}
		>
			{avatar && <ItemMedia className='rcx-option__avatar'>{avatar}</ItemMedia>}
			{icon && (
				<ItemIcon className='rcx-option__column' label={iconLabel}>
					<Icon name={icon} size='x20' className='rcx-option__icon' />
				</ItemIcon>
			)}
			{gap && <ItemIcon className='rcx-option__column' />}
			{label && (
				<ItemContent className='rcx-option__content'>
					<ItemTitle>{label as ReactNode}</ItemTitle>
				</ItemContent>
			)}
			{label !== children && children}
		</Item>
	);
}

export default memo(Option);
