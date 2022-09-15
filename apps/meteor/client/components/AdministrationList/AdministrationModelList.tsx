import { OptionTitle } from '@rocket.chat/fuselage';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { FC } from 'react';

import { SideNav } from '../../../app/ui-utils/client';
import { AccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import { getUpgradeTabLabel, isFullyFeature } from '../../../lib/upgradeTab';
import { useUpgradeTabParams } from '../../views/hooks/useUpgradeTabParams';
import Emoji from '../Emoji';
import ListItem from '../Sidebar/ListItem';

type AdministrationModelListProps = {
	accountBoxItems: AccountBoxItem[];
	showAdmin: boolean;
	closeList: () => void;
};

const AdministrationModelList: FC<AdministrationModelListProps> = ({ accountBoxItems, showAdmin, closeList }) => {
	const t = useTranslation();
	const { tabType, trialEndDate, isLoading } = useUpgradeTabParams();
	const shouldShowEmoji = isFullyFeature(tabType);
	const label = getUpgradeTabLabel(tabType);

	const infoRoute = useRoute('admin-info');
	const upgradeRoute = useRoute('upgrade');
	const showUpgradeItem = !isLoading && tabType;

	return (
		<>
			<OptionTitle>{t('Administration')}</OptionTitle>
			<ul>
				{showAdmin && (
					<>
						{showUpgradeItem && (
							<ListItem
								icon='arrow-stack-up'
								text={
									<>
										{t(label)} {shouldShowEmoji && <Emoji emojiHandle=':zap:' />}
									</>
								}
								action={(): void => {
									upgradeRoute.push({ type: tabType }, trialEndDate ? { trialEndDate } : undefined);
									closeList();
								}}
							/>
						)}
						<ListItem
							icon='cog'
							text={t('Manage_workspace')}
							action={(): void => {
								infoRoute.push();
								closeList();
							}}
						/>
					</>
				)}
				{accountBoxItems.length > 0 && (
					<>
						{accountBoxItems.map((item, key) => {
							const action = (): void => {
								if (item.href) {
									FlowRouter.go(item.href);
								}
								if (item.sideNav) {
									SideNav.setFlex(item.sideNav);
									SideNav.openFlex();
								}
								closeList();
							};

							return <ListItem text={t(item.name)} icon={item.icon} action={action} key={item.name + key} />;
						})}
					</>
				)}
			</ul>
		</>
	);
};

export default AdministrationModelList;
