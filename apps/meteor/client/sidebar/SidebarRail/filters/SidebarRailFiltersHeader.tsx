import type { ISidebarFiltersDisplay } from '@rocket.chat/core-typings';
import { Box, NavBarItem, RadioButton, SidebarDivider, ToggleSwitch } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useFilterModals } from './hooks/useFilterModals';
import { useSetFiltersDisplay } from './hooks/useFilterMutations';
import { useSidebarFiltersDisplay } from './hooks/useSidebarFiltersPreferences';

const SidebarRailFiltersHeader = () => {
	const { t } = useTranslation();
	const { openCreateFilter, openManageLabels } = useFilterModals();
	const { viewMode, displayAvatar } = useSidebarFiltersDisplay();
	const { mutate: setDisplay } = useSetFiltersDisplay();

	const viewModeItem = (
		id: ISidebarFiltersDisplay['viewMode'],
		content: string,
		icon: GenericMenuItemProps['icon'],
	): GenericMenuItemProps => ({
		id,
		content,
		icon,
		onClick: () => setDisplay({ viewMode: id }),
		addon: <RadioButton checked={viewMode === id} onChange={() => undefined} />,
	});

	const displayItems: GenericMenuItemProps[] = [
		viewModeItem('extended', t('Extended'), 'extended-view'),
		viewModeItem('medium', t('Medium'), 'medium-view'),
		viewModeItem('condensed', t('Condensed'), 'condensed-view'),
		{
			id: 'avatars',
			content: t('Avatars'),
			icon: 'user-rounded',
			onClick: () => setDisplay({ displayAvatar: !displayAvatar }),
			addon: <ToggleSwitch checked={displayAvatar} onChange={() => undefined} />,
		},
	];

	return (
		<>
			<Box is='header' display='flex' alignItems='center' justifyContent='space-between' paddingInline={16} paddingBlock={8}>
				<Box is='h2' fontScale='p2b' color='titles-labels' withTruncatedText>
					{t('Filters')}
				</Box>
				<Box display='flex' alignItems='center' gap={8}>
					<NavBarItem title={t('Create_filter')} icon='plus' onClick={openCreateFilter} />
					<NavBarItem title={t('Manage_labels')} icon='tag' onClick={openManageLabels} />
					<GenericMenu
						icon='sort'
						title={t('Display')}
						sections={[{ title: t('Display'), items: displayItems }]}
						selectionMode='multiple'
						is={NavBarItem}
						placement='bottom-end'
					/>
				</Box>
			</Box>
			<SidebarDivider />
		</>
	);
};

export default SidebarRailFiltersHeader;
