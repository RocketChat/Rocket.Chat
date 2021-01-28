import { useCallback } from 'react';

import { useReactiveValue } from '../../hooks/useReactiveValue';
import { CannedResponse as CannedResponsesCollection } from '../../canned-responses/collections/CannedResponse';

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
