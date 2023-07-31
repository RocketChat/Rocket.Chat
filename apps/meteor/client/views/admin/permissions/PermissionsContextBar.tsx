import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRoute, useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import { Contextualbar, ContextualbarHeader, ContextualbarTitle, ContextualbarClose } from '../../../components/Contextualbar';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import CustomRoleUpsellModal from './CustomRoleUpsellModal';
import EditRolePageWithData from './EditRolePageWithData';

const PermissionsContextBar = (): ReactElement | null => {
	const t = useTranslation();
	const _id = useRouteParameter('_id');
	const context = useRouteParameter('context');
	const router = useRoute('admin-permissions');
	const setModal = useSetModal();
	const { data } = useIsEnterprise();
	const isEnterprise = !!data?.isEnterprise;

	const handleCloseContextualbar = useMutableCallback(() => {
		router.push({});
	});

	useEffect(() => {
		if (context !== 'new' || isEnterprise) {
			return;
		}

		setModal(<CustomRoleUpsellModal onClose={() => setModal(null)} />);
		handleCloseContextualbar();
	}, [context, isEnterprise, handleCloseContextualbar, setModal]);

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
