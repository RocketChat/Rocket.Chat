import { Divider } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { Fragment, memo } from 'react';

import type { SidebarItem } from '../../lib/createSidebarItems';
import { isSidebarItem } from '../../lib/createSidebarItems';
import SidebarNavigationItem from './SidebarNavigationItem';

type SidebarItemsAssemblerProps = {
	items: SidebarItem[];
	currentPath?: string;
};

const SidebarItemsAssembler = ({ items, currentPath }: SidebarItemsAssemblerProps) => {
	const t = useTranslation();

	return (
		<>
			{items.map((props) => (
				<Fragment key={props.i18nLabel}>
					{isSidebarItem(props) ? (
						<SidebarNavigationItem
							permissionGranted={props.permissionGranted}
							pathSection={props.href ?? props.pathSection ?? ''}
							icon={props.icon}
							label={t((props.i18nLabel || props.name) as Parameters<typeof t>[0])}
							currentPath={currentPath}
							tag={props.tag && t.has(props.tag) ? t(props.tag) : props.tag}
							externalUrl={props.externalUrl}
							badge={props.badge}
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
