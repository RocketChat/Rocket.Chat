import { Callout } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import EditRolePage from './EditRolePage';
import { useRole } from './useRole';

const EditRolePageContainer = ({ _id }) => {
	const t = useTranslation();
	const role = useRole(_id);

	if (!role) {
		return <Callout type='danger'>{t('error-invalid-role')}</Callout>;
	}

	return <EditRolePage key={_id} data={role} />;
};

export default EditRolePageContainer;
