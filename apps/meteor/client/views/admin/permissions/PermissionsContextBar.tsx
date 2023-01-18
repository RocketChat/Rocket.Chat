import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRoute, useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import CustomRoleUpsellModal from './CustomRoleUpsellModal';
import EditRolePageWithData from './EditRolePageWithData';

const PermissionsContextBar = ({ isEnterprise }: { isEnterprise: boolean }): ReactElement | null => {
	const t = useTranslation();
	const _id = useRouteParameter('_id');
	const context = useRouteParameter('context');
	const router = useRoute('admin-permissions');
	const setModal = useSetModal();

	const handleCloseVerticalBar = useMutableCallback(() => {
		router.push({});
	});

	useEffect(() => {
		if (context !== 'new' || isEnterprise) {
			return;
		}

		setModal(<CustomRoleUpsellModal onClose={() => setModal()} />);
		handleCloseVerticalBar();
	}, [context, isEnterprise, handleCloseVerticalBar, setModal]);

	return (
		(context && (
			<VerticalBar>
				<VerticalBar.Header>
					<VerticalBar.Text>{context === 'edit' ? t('Role_Editing') : t('New_role')}</VerticalBar.Text>
					<VerticalBar.Close onClick={handleCloseVerticalBar} />
				</VerticalBar.Header>
				<EditRolePageWithData roleId={_id} />
			</VerticalBar>
		)) ||
		null
	);
};

export default PermissionsContextBar;
