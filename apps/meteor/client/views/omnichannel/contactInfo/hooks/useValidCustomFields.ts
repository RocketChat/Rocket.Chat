import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useCustomFieldsQuery } from '../../hooks/useCustomFieldsQuery';

const checkIsVisibleAndCorrectScope = (key: string, customFields: ILivechatCustomField[], scope: 'visitor' | 'room') => {
	const field = customFields?.find(({ _id }) => _id === key);
	return field?.visibility === 'visible' && field?.scope === scope;
};

export const useValidCustomFields = (userCustomFields: Record<string, string | unknown> | undefined, scope: 'visitor' | 'room') => {
	const { data, isError } = useCustomFieldsQuery();
	const canViewCustomFields = usePermission('view-livechat-room-customfields');

	const customFieldEntries = useMemo(() => {
		if (!canViewCustomFields || !userCustomFields || !data?.customFields || isError) {
			return [];
		}

		return Object.entries(userCustomFields).filter(
			([key, value]) => checkIsVisibleAndCorrectScope(key, data?.customFields, scope) && value,
		);
	}, [canViewCustomFields, userCustomFields, data?.customFields, isError, scope]);

	return customFieldEntries;
};
