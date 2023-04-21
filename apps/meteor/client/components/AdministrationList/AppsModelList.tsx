import { Badge, OptionTitle, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { triggerActionButtonAction } from '../../../app/ui-message/client/ActionManager';
import type { IAppAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import { useAppRequestStats } from '../../views/marketplace/hooks/useAppRequestStats';
import ListItem from '../Sidebar/ListItem';

type AppsModelListProps = {
	appBoxItems: IAppAccountBoxItem[];
	appsManagementAllowed?: boolean;
	onDismiss: () => void;
};

const AppsModelList = ({ appBoxItems, appsManagementAllowed, onDismiss }: AppsModelListProps): ReactElement => {
	const t = useTranslation();
	const marketplaceRoute = useRoute('marketplace');
	const page = 'list';

	const appRequestStats = useAppRequestStats();

	return (
		<>
			<OptionTitle>{t('Apps')}</OptionTitle>
			<ul>
				<>
					<ListItem
						role='listitem'
						icon='store'
						text={t('Marketplace')}
						onClick={() => {
							marketplaceRoute.push({ context: 'explore', page });
							onDismiss();
						}}
					/>
					<ListItem
						role='listitem'
						icon='circle-arrow-down'
						text={t('Installed')}
						onClick={() => {
							marketplaceRoute.push({ context: 'installed', page });
							onDismiss();
						}}
					/>

					{appsManagementAllowed && (
						<>
							<ListItem
								role='listitem'
								icon='cube'
								text={t('Requested')}
								onClick={(): void => {
									marketplaceRoute.push({ context: 'requested', page });
									onDismiss();
								}}
							>
								{appRequestStats.isLoading && <Skeleton variant='circle' height={16} width={16} />}
								{appRequestStats.isSuccess && appRequestStats.data.data.totalUnseen > 0 && (
									<Badge variant='primary'>{appRequestStats.data.data.totalUnseen}</Badge>
								)}
							</ListItem>
						</>
					)}
				</>
				{appBoxItems.length > 0 && (
					<>
						{appBoxItems.map((item, key) => {
							const action = () => {
								triggerActionButtonAction({
									rid: '',
									mid: '',
									actionId: item.actionId,
									appId: item.appId,
									payload: { context: item.context },
								});
								onDismiss();
							};
							return (
								<ListItem
									role='listitem'
									text={(t.has(item.name) && t(item.name)) || item.name}
									onClick={action}
									key={item.actionId + key}
								/>
							);
						})}
					</>
				)}
			</ul>
		</>
	);
};

export default AppsModelList;
