import { Menu, MenuItem, MenuSection, MenuSubmenuTrigger } from '@rocket.chat/fuselage';
import { GenericMenuItem, useHandleMenuAction } from '@rocket.chat/ui-client';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useCategoryMenuItems } from './hooks/useCategoryMenuItems';
import type { RoomMenuSection } from '../../hooks/useRoomMenuActions';

type Section = RoomMenuSection;

type CategoryRoomMenuProps = {
	rid: string;
	name?: string;
	sections: Section[];
};

const CategoryRoomMenu = ({ rid, name = '', sections }: CategoryRoomMenuProps) => {
	const { t } = useTranslation();
	const subscription = useUserSubscription(rid);

	const isFavorite = Boolean(subscription?.f);
	const { targetItems, utilItems, allCategoryItems } = useCategoryMenuItems({ rid, name, isFavorite, categoryId: subscription?.category });

	// Strip toggleFavorite — the category submenu takes over the favorites action. A choice section (notifications)
	// is listed as a submenu of its own, its current state checked.
	const choiceSections = sections.filter((section) => section.selectedId);
	const actionSections = sections
		.filter((section) => !section.selectedId)
		.map((section) => ({ ...section, items: section.items.filter((item) => item.id !== 'toggleFavorite') }))
		.filter((section) => section.items.length > 0);

	const allItems = [...actionSections.flatMap((s) => s.items), ...choiceSections.flatMap((s) => s.items), ...allCategoryItems];
	const disabledKeys = allItems.filter(({ disabled }) => disabled).map(({ id }) => id);
	const handleAction = useHandleMenuAction(allItems);

	return (
		<Menu
			detached
			title={t('Options')}
			size='mini'
			icon='kebab'
			aria-keyshortcuts='alt'
			onAction={handleAction}
			disabledKeys={disabledKeys}
		>
			{[
				...actionSections.map(({ title, items }, index) => (
					<MenuSection key={title || String(index)} aria-label={title || t('Options')} title={title || undefined} items={items}>
						{(item) => (
							<MenuItem key={item.id}>
								<GenericMenuItem {...item} />
							</MenuItem>
						)}
					</MenuSection>
				)),
				...choiceSections.map((section) => (
					<MenuSection key={section.id} aria-label={section.title}>
						<MenuSubmenuTrigger
							key={`${section.id}-submenu`}
							textValue={section.title}
							selectionMode='single'
							selectedKeys={section.selectedId ? [section.selectedId] : []}
						>
							<MenuItem aria-label={section.title}>
								<GenericMenuItem id={section.id ?? section.title} icon='bell' content={section.title} />
							</MenuItem>
							<MenuSection items={section.items}>
								{(item) => (
									<MenuItem key={item.id} textValue={typeof item.content === 'string' ? item.content : undefined}>
										<GenericMenuItem {...item} />
									</MenuItem>
								)}
							</MenuSection>
						</MenuSubmenuTrigger>
					</MenuSection>
				)),
				<MenuSection key='category' title={t('Category')}>
					<MenuSubmenuTrigger key='moveTo' textValue={t('Move_to')}>
						<MenuItem aria-label={t('Move_to')}>
							<GenericMenuItem icon='folder' content={t('Move_to')} id='moveTo' />
						</MenuItem>
						<MenuSection items={targetItems}>
							{(item) => (
								<MenuItem key={item.id}>
									<GenericMenuItem {...item} />
								</MenuItem>
							)}
						</MenuSection>
						{utilItems.length > 0 && (
							<MenuSection items={utilItems}>
								{(item) => (
									<MenuItem key={item.id}>
										<GenericMenuItem {...item} />
									</MenuItem>
								)}
							</MenuSection>
						)}
					</MenuSubmenuTrigger>
				</MenuSection>,
			]}
		</Menu>
	);
};

export default memo(CategoryRoomMenu);
