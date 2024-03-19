import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRoute, useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import { Contextualbar, ContextualbarHeader, ContextualbarTitle, ContextualbarClose } from '../../../components/Contextualbar';
import CustomRoleUpsellModal from './CustomRoleUpsellModal';
import EditRolePageWithData from './EditRolePageWithData';

const PermissionsContextBar = (): ReactElement | null => {
	const t = useTranslation();
	const _id = useRouteParameter('_id');
	const context = useRouteParameter('context');
	const router = useRoute('admin-permissions');
	const setModal = useSetModal();
	const hasCustomRolesModule = useHasLicenseModule('custom-roles') === true;

	const handleCloseContextualbar = useMutableCallback(() => {
		router.push({});
	});

	useEffect(() => {
		if (context !== 'new' || hasCustomRolesModule) {
			return;
		}

		setModal(<CustomRoleUpsellModal onClose={() => setModal(null)} />);
		handleCloseContextualbar();
	}, [context, hasCustomRolesModule, handleCloseContextualbar, setModal]);

	return (
		(context && (
			<Contextualbar>
				<ContextualbarHeader>
					<ContextualbarTitle>{context === 'edit' ? t('Role_Editing') : t('New_role')}</ContextualbarTitle>
					<ContextualbarClose onClick={handleCloseContextualbar} />
				</ContextualbarHeader>
				<EditRolePageWithData roleId={_id} />
			</Contextualbar>
		)) ||
		null
	);
};

export default PermissionsContextBar;
