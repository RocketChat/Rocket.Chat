import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRoute, useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

import CustomRoleUpsellModal from './CustomRoleUpsellModal';
import EditRolePageWithData from './EditRolePageWithData';
import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarDialog,
} from '../../../components/Contextualbar';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const PermissionsContextBar = (): ReactElement | null => {
	const t = useTranslation();
	const _id = useRouteParameter('_id');
	const context = useRouteParameter('context');
	const router = useRoute('admin-permissions');
	const setModal = useSetModal();
	const hasCustomRolesModule = useHasLicenseModule('custom-roles') === true;

	const handleCloseContextualbar = useEffectEvent(() => {
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
			<ContextualbarDialog>
				<Contextualbar>
					<ContextualbarHeader>
						<ContextualbarTitle>{context === 'edit' ? t('Role_Editing') : t('New_role')}</ContextualbarTitle>
						<ContextualbarClose onClick={handleCloseContextualbar} />
					</ContextualbarHeader>
					<EditRolePageWithData roleId={_id} />
				</Contextualbar>
			</ContextualbarDialog>
		)) ||
		null
	);
};

export default PermissionsContextBar;
