import { IconButton, MenuItem, MenuSection, MenuSubmenuTrigger, Menu } from '@rocket.chat/fuselage';
import { cloneElement, type ComponentProps, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { GenericMenuItemProps, GenericMenuSubItemProps } from './GenericMenuItem';
import GenericMenuItem from './GenericMenuItem';
import { useHandleMenuAction } from './hooks/useHandleMenuAction';

type GenericMenuCommonProps = {
	title: string;
	icon?: ComponentProps<typeof IconButton>['icon'];
	disabled?: boolean;
	callbackAction?: () => void;
	isOpen?: boolean;
};

type GenericMenuConditionalProps =
	| {
			sections?: {
				title?: ReactNode;
				items: GenericMenuItemProps[];
				permission?: boolean | '' | 0 | null | undefined;
			}[];
			items?: never;
	  }
	| {
			items?: GenericMenuItemProps[];
			sections?: never;
	  };

export type GenericMenuProps = GenericMenuCommonProps & GenericMenuConditionalProps & Omit<ComponentProps<typeof Menu>, 'children'>;

const getTextValue = ({ textValue, content }: GenericMenuItemProps) => textValue ?? (typeof content === 'string' ? content : undefined);

const alignItems = <TItem extends GenericMenuItemProps>(items: TItem[], hasIcon: boolean): TItem[] =>
	hasIcon ? items.map((item) => ({ ...item, gap: item.gap ?? (!item.icon && !item.status) })) : items;

const renderSubItem = (item: GenericMenuSubItemProps) => {
	const textValue = getTextValue(item);

	// A sub menu keeps its own collection, out of reach of the root menu's `disabledKeys`; `isDisabled` on the item
	// is what react-stately reads there.
	return (
		<MenuItem key={item.id} {...(textValue && { textValue })} {...(item.disabled && { isDisabled: true })}>
			<GenericMenuItem {...item} />
		</MenuItem>
	);
};

const renderItem = (item: GenericMenuItemProps) => {
	if (!item.items?.length) {
		return (
			<MenuItem key={item.id} {...(item.textValue && { textValue: item.textValue })}>
				<GenericMenuItem {...item} />
			</MenuItem>
		);
	}

	const textValue = getTextValue(item);

	return (
		<MenuSubmenuTrigger key={item.id} {...(textValue && { textValue })}>
			<MenuItem>
				<GenericMenuItem {...item} />
			</MenuItem>
			<MenuSection
				aria-label={textValue}
				items={alignItems(
					item.items,
					item.items.some(({ icon }) => icon),
				)}
			>
				{renderSubItem}
			</MenuSection>
		</MenuSubmenuTrigger>
	);
};

const GenericMenu = ({ title, icon = 'menu', disabled, onAction, callbackAction, button, className, ...props }: GenericMenuProps) => {
	const { t, i18n } = useTranslation();

	const sections = 'sections' in props && props.sections;
	const items = 'items' in props && props.items;

	const itemsList = sections ? sections.flatMap(({ items }) => items) : items || [];

	const disabledKeys = itemsList.filter(({ disabled }) => disabled).map(({ id }) => id);
	const handleAction = useHandleMenuAction(itemsList || [], callbackAction);

	const hasIcon = itemsList.some(({ icon }) => icon);
	const handleItems = (items: GenericMenuItemProps[]) => alignItems(items, hasIcon);

	const isMenuEmpty = !(sections && sections.length > 0) && !(items && items.length > 0);

	if (isMenuEmpty || disabled) {
		if (button) {
			// FIXME: deprecate prop `button` as there's no way to ensure it is actually a button
			// (e.g cloneElement could be passing props to a fragment)
			return cloneElement(button, { size: button.props.size ?? 'small', icon, disabled, title, className } as any);
		}

		return <IconButton size='small' icon={icon} className={className} title={title} disabled />;
	}

	return (
		<>
			{sections && (
				<Menu
					icon={icon}
					title={i18n.exists(title) ? t(title) : title}
					onAction={onAction || handleAction}
					className={className}
					button={button}
					{...(disabledKeys && { disabledKeys })}
					{...props}
				>
					{sections.map(({ title, items }, key) => (
						<MenuSection
							title={typeof title === 'string' && i18n.exists(title) ? t(title) : title}
							items={handleItems(items)}
							key={typeof title === 'string' ? `${title}-${key}` : key}
						>
							{renderItem}
						</MenuSection>
					))}
				</Menu>
			)}
			{items && (
				<Menu
					icon={icon}
					title={i18n.exists(title) ? t(title) : title}
					onAction={onAction || handleAction}
					className={className}
					button={button}
					{...(disabledKeys && { disabledKeys })}
					{...props}
				>
					{handleItems(items).map(renderItem)}
				</Menu>
			)}
		</>
	);
};

export default GenericMenu;
