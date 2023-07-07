import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouter, useTranslation, useMethod, useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import GenericMenu from '../../components/GenericMenu/GenericMenu';
import type { GenericMenuItemProps } from '../../components/GenericMenu/GenericMenuItem';
import { useHandleMenuAction } from '../../components/GenericMenu/hooks/useHandleMenuAction';
import NavbarAction from '../../components/Navbar/NavbarAction';
import { useExternalLink } from '../../hooks/useExternalLink';
import RegisterWorkspaceModal from '../../views/admin/cloud/modals/RegisterWorkspaceModal';

const NavbarRegistrationAction = () => {
	const t = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();
	const cloudURL = useSetting<string>('Cloud_Url');
	const handleLinkClick = useExternalLink();

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

	console.log(cloudURL);

	const handleAction = useHandleMenuAction(registrationItems);

	return (
		<NavbarAction>
			<GenericMenu medium title={t('Registration')} icon='cloud-plus' onAction={handleAction} items={registrationItems} />
		</NavbarAction>
	);
};

export default NavbarRegistrationAction;
