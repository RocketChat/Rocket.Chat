import { Divider } from '@rocket.chat/fuselage';
import { Fragment, memo } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarNavigationItem from './SidebarNavigationItem';
import type { SidebarItem } from '../../lib/createSidebarItems';
import { isSidebarItem } from '../../lib/createSidebarItems';

type SidebarItemsAssemblerProps = {
	items: SidebarItem[];
	currentPath?: string;
};

const SidebarItemsAssembler = ({ items, currentPath }: SidebarItemsAssemblerProps) => {
	const { t, i18n } = useTranslation();

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
							tag={props.tag && i18n.exists(props.tag) ? t(props.tag) : props.tag}
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
