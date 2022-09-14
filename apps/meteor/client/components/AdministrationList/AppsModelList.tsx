import { OptionTitle } from '@rocket.chat/fuselage';
import { useAtLeastOnePermission, useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import { triggerActionButtonAction } from '../../../app/ui-message/client/ActionManager';
import { IAppAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import { MANAGE_APPS_PERMISSIONS } from '../../sidebar/header/actions/constants';
import ListItem from '../Sidebar/ListItem';

type AppsModelListProps = {
	appBoxItems: IAppAccountBoxItem[];
	closeList: () => void;
};

const AppsModelList: FC<AppsModelListProps> = ({ appBoxItems, closeList }) => {
	const t = useTranslation();
	const marketplaceRoute = useRoute('admin-marketplace');
	const showManageApps = useAtLeastOnePermission(MANAGE_APPS_PERMISSIONS);

	return (
		<>
			<OptionTitle>{t('Apps')}</OptionTitle>
			<ul>
				{showManageApps && (
					<>
						<ListItem
							icon='cube'
							text={t('Marketplace')}
							action={(): void => {
								marketplaceRoute.push();
								closeList();
							}}
						/>
						<ListItem
							icon='cube'
							text={t('Installed')}
							action={(): void => {
								marketplaceRoute.push({ context: 'installed' });
								closeList();
							}}
						/>
					</>
				)}
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
