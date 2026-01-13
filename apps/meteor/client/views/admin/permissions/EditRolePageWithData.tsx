import type { IRole } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import EditRolePage from './EditRolePage';
import { useRole } from './hooks/useRole';
import GenericError from '../../../components/GenericError';
import PageSkeleton from '../../../components/PageSkeleton';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const EditRolePageWithData = ({ roleId }: { roleId?: IRole['_id'] }): ReactElement => {
	const { t } = useTranslation();
	const role = useRole(roleId);
	const context = useRouteParameter('context');
	const { isPending, isError, data: hasLicense } = useHasLicenseModule('custom-roles');

	if (!role && context === 'edit') {
		return <Callout type='danger'>{t('error-invalid-role')}</Callout>;
	}

	if (isPending) {
		return <PageSkeleton />;
	}

	if (isError) {
		return <GenericError />;
	}

	return <EditRolePage key={roleId} role={role} isEnterprise={hasLicense} />;
};

export default EditRolePageWithData;
