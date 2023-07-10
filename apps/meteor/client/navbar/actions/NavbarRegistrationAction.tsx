import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouter, useTranslation, useMethod, useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { AllHTMLAttributes } from 'react';
import React from 'react';

import GenericMenu from '../../components/GenericMenu/GenericMenu';
import type { GenericMenuItemProps } from '../../components/GenericMenu/GenericMenuItem';
import { useHandleMenuAction } from '../../components/GenericMenu/hooks/useHandleMenuAction';
import { NavbarAction } from '../../components/Navbar';
import { useExternalLink } from '../../hooks/useExternalLink';
import { CLOUD_CONSOLE_URL } from '../../lib/constants';
import RegisterWorkspaceModal from '../../views/admin/cloud/modals/RegisterWorkspaceModal';

const NavbarRegistrationAction = (props: AllHTMLAttributes<HTMLLIElement>) => {
	const t = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();
	const cloudURL = useSetting<string>('Cloud_Url') || CLOUD_CONSOLE_URL;
	const handleLinkClick = useExternalLink();
	const routeName = router.getRouteName();

	const checkCloudRegisterStatus = useMethod('cloud:checkRegisterStatus');
	const result = useQuery(['admin/cloud/register-status'], async () => checkCloudRegisterStatus());
	const { workspaceRegistered } = result.data || {};

	const handleRegisterWorkspaceClick = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<RegisterWorkspaceModal onClose={handleModalClose} />);
	};

	const registrationItem: GenericMenuItemProps = {
		id: 'registration',
		content: workspaceRegistered ? t('Registration') : t('Register'),
		onClick: () => {
			if (workspaceRegistered) {
				router.navigate('/admin/cloud');
				return;
			}
			handleRegisterWorkspaceClick();
		},
	};

	const registrationItems = [
		registrationItem,
		{
			id: 'cloud-portal',
			content: t('Cloud_portal') as TranslationKey,
			onClick: () => handleLinkClick(cloudURL),
		},
	];

	const handleAction = useHandleMenuAction(registrationItems);

	return (
		<NavbarAction {...props}>
			<GenericMenu
				pressed={routeName === 'cloud'}
				medium
				title={t('Registration')}
				icon='cloud-plus'
				onAction={handleAction}
				items={registrationItems}
			/>
		</NavbarAction>
	);
};

export default NavbarRegistrationAction;
