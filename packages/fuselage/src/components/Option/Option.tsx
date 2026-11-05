import type { ReactNode, MouseEvent, AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { memo } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';
import { prevent } from '../../helpers/prevent';
import { useArrayLikeClassNameProp } from '../../hooks/useArrayLikeClassNameProp';
import { Icon, type IconProps } from '../Icon';
import { Item, ItemContent, ItemIcon, ItemMedia, ItemTitle } from '../Item';

export type OptionProps<TLabel = ReactNode> = RefAttributes<Element> & {
	is?: ElementType;
	id?: string;
	children?: ReactNode;
	label?: TLabel;
	focus?: boolean;
	/** Shows the focus ring on the option when a script moves focus to it, such as a combobox's active descendant. */
	focusVisible?: boolean;
	selected?: boolean;
	className?: string;
	icon?: IconProps['name'];
	/** Names what the `icon` conveys, such as "Federated". Without it, the icon is decorative. */
	iconLabel?: string;
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
 * The generic `Option` item of options. Can be freely used or inside the `Options` as well.
 *
 * It renders an `Item` row, so its content can also be composed from `Item` parts.
 */
function Option<TLabel = ReactNode>({
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
			{...(props as Omit<typeof props, 'ref'>)}
			ref={props.ref as RefAttributes<HTMLElement>['ref']}
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
