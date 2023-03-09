import type { IRole } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import PageSkeleton from '../../../components/PageSkeleton';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import EditRolePage from './EditRolePage';
import { useRole } from './hooks/useRole';

const EditRolePageWithData = ({ roleId }: { roleId?: IRole['_id'] }): ReactElement => {
	const t = useTranslation();
	const role = useRole(roleId);
	const context = useRouteParameter('context');
	const { data, isLoading } = useIsEnterprise();

	if (!role && context === 'edit') {
		return <Callout type='danger'>{t('error-invalid-role')}</Callout>;
	}

	if (isLoading || !data) {
		return <PageSkeleton />;
	}

	return <EditRolePage key={roleId} role={role} isEnterprise={data.isEnterprise} />;
};

export default EditRolePageWithData;
