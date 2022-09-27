import { OptionTitle } from '@rocket.chat/fuselage';
import { useTranslation, useRoute, useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import { triggerActionButtonAction } from '../../../app/ui-message/client/ActionManager';
import { IAppAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import ListItem from '../Sidebar/ListItem';

type AppsModelListProps = {
	appBoxItems: IAppAccountBoxItem[];
	closeList: () => void;
};

const MANAGE_APPS_PERMISSIONS = ['manage-apps'];

const AppsModelList: FC<AppsModelListProps> = ({ appBoxItems, closeList }) => {
	const t = useTranslation();
	const canManageApps = useAtLeastOnePermission(MANAGE_APPS_PERMISSIONS);
	const adminAppsRoute = useRoute('admin-marketplace');
	const appsRoute = useRoute('marketplace');

	return (
		<>
			<OptionTitle>{t('Apps')}</OptionTitle>
			<ul>
				<>
					<ListItem
						icon='cube'
						text={t('Marketplace')}
						action={(): void => {
							canManageApps ? adminAppsRoute.push() : appsRoute.push();
							closeList();
						}}
					/>
					<ListItem
						icon='cube'
						text={t('Installed')}
						action={(): void => {
							canManageApps ? adminAppsRoute.push({ context: 'installed' }) : appsRoute.push({ context: 'installed' });
							closeList();
						}}
					/>
				</>
				{appBoxItems.length > 0 && (
					<>
						{appBoxItems.map((item, key) => {
							const action = (): void => {
								triggerActionButtonAction({
									rid: '',
									mid: '',
									actionId: item.actionId,
									appId: item.appId,
									payload: { context: item.context },
								});
								closeList();
							};
							return <ListItem text={(t.has(item.name) && t(item.name)) || item.name} action={action} key={item.actionId + key} />;
						})}
					</>
				)}
			</ul>
		</>
	);
};

export default AppsModelList;
