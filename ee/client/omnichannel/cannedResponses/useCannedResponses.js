import { useCallback } from 'react';

import { useReactiveValue } from '../../../../client/hooks/useReactiveValue';
import { CannedResponse as CannedResponsesCollection } from '../../../app/canned-responses/client/collections/CannedResponse';

export const useCannedResponses = (filter, departmentId, _id) => useReactiveValue(useCallback(() => {
	const query = {
		...departmentId && {
			departmentId,
			scope: 'department',
		},
		..._id && { _id },
		...!_id && { $or: [
			{
				shortcut: {
					$regex: filter,
					$options: 'i',
				},
			},
			{
				text: {
					$regex: filter,
					$options: 'i',
				},
			},
		] },
	};

	return CannedResponsesCollection.find(query).fetch();
}, [departmentId, filter, _id]));
