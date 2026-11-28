import { Divider } from '@rocket.chat/fuselage';
import { Fragment, memo } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarNavigationItem from './SidebarNavigationItem';
import type { SidebarItem } from '../../lib/createSidebarItems';
import { isSidebarItem } from '../../lib/createSidebarItems';

export type SidebarItemsAssemblerProps = {
	items: SidebarItem[];
	currentPath?: string;
};

const SidebarItemsAssembler = ({ items, currentPath }: SidebarItemsAssemblerProps) => {
	const { t, i18n } = useTranslation();

	return (
		<>
			{items.map((item) => (
				<Fragment key={item.i18nLabel}>
					{isSidebarItem(item) ? (
						<SidebarNavigationItem
							permissionGranted={item.permissionGranted}
							pathSection={item.href ?? item.pathSection ?? ''}
							icon={item.icon}
							label={t((item.i18nLabel || item.name) as Parameters<typeof t>[0])}
							currentPath={currentPath}
							tag={item.tag && i18n.exists(item.tag) ? t(item.tag) : item.tag}
							externalUrl={item.externalUrl}
							badge={item.badge}
						/>
					) : (
						<Divider />
					)}
				</Fragment>
			))}
		</>
	);
};

export default memo(SidebarItemsAssembler);
