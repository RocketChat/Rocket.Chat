import { useTranslation, useRoute, useMethod, useSetModal, useRole, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import type { AccountBoxItem } from '../../../../../app/ui-utils/client/lib/AccountBox';
import type { UpgradeTabVariant } from '../../../../../lib/upgradeTab';
import { getUpgradeTabLabel, isFullyFeature } from '../../../../../lib/upgradeTab';
import Emoji from '../../../../components/Emoji';
import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';
import RegisterWorkspaceModal from '../../../../views/admin/cloud/modals/RegisterWorkspaceModal';
import { useUpgradeTabParams } from '../../../../views/hooks/useUpgradeTabParams';

type useAdministrationItemProps = {
	accountBoxItems: AccountBoxItem[];
	showWorkspace: boolean;
};
export const useAdministrationItems = ({ accountBoxItems, showWorkspace }: useAdministrationItemProps): GenericMenuItemProps[] => {
	const router = useRouter();
	const t = useTranslation();

	const { tabType, trialEndDate, isLoading } = useUpgradeTabParams();
	const shouldShowEmoji = isFullyFeature(tabType);
	const label = getUpgradeTabLabel(tabType);
	const isAdmin = useRole('admin');
	const setModal = useSetModal();

	const checkCloudRegisterStatus = useMethod('cloud:checkRegisterStatus');
	const result = useQuery(['admin/cloud/register-status'], async () => checkCloudRegisterStatus());
	const { workspaceRegistered } = result.data || {};

	const handleRegisterWorkspaceClick = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<RegisterWorkspaceModal onClose={handleModalClose} />);
	};

	const adminRoute = useRoute('admin-index');
	const upgradeRoute = useRoute('upgrade');
	const cloudRoute = useRoute('cloud');
	const showUpgradeItem = !isLoading && tabType;

	const upgradeItem: GenericMenuItemProps = {
		id: 'showUpgradeItem',
		content: (
			<>
				{t(label)} {shouldShowEmoji && <Emoji emojiHandle=':zap:' />}
			</>
		),
		icon: 'arrow-stack-up',
		onClick: () => {
			upgradeRoute.push({ type: tabType as UpgradeTabVariant }, trialEndDate ? { trialEndDate } : undefined);
		},
	};
	const adminItem: GenericMenuItemProps = {
		id: 'registration',
		content: workspaceRegistered ? t('Registration') : t('Register'),
		icon: 'cloud-plus',
		onClick: () => {
			if (workspaceRegistered) {
				cloudRoute.push({ context: '/' });
				return;
			}
			handleRegisterWorkspaceClick();
		},
	};
	const workspaceItem: GenericMenuItemProps = {
		id: 'workspace',
		content: t('Workspace'),
		icon: 'cog',
		onClick: () => {
			adminRoute.push({ context: '/' });
		},
	};

	const accountBoxItem: GenericMenuItemProps[] = accountBoxItems.map((item, key) => {
		const action = () => {
			if (item.href) {
				router.navigate(item.href);
			}
		};
		return {
			id: `account-box-item-${key}`,
			content: t(item.name),
			icon: item.icon,
			onClick: action,
		};
	});

	return [
		...(showUpgradeItem ? [upgradeItem] : []),
		...(isAdmin ? [adminItem] : []),
		...(showWorkspace ? [workspaceItem] : []),
		...(accountBoxItems.length ? accountBoxItem : []),
	];
};
