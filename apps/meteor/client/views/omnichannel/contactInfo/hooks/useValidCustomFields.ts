import { usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useCustomFieldsQuery } from './useCustomFieldsQuery';

const checkIsVisibleAndScopeVisitor = (key: string, customFields: Record<string, string | unknown>[]) => {
	const field = customFields?.find(({ _id }) => _id === key);
	return field?.visibility === 'visible' && field?.scope === 'visitor';
};

export const useValidCustomFields = (userCustomFields: Record<string, string | unknown> | undefined) => {
	const { data, isError } = useCustomFieldsQuery();
	const canViewCustomFields = usePermission('view-livechat-room-customfields');

	const customFieldEntries = useMemo(() => {
		if (!canViewCustomFields || !userCustomFields || !data?.customFields || isError) {
			return [];
		}

		return Object.entries(userCustomFields).filter(([key, value]) => checkIsVisibleAndScopeVisitor(key, data?.customFields) && value);
	}, [data?.customFields, userCustomFields, canViewCustomFields, isError]);

	return customFieldEntries;
};
