import React, { useMemo } from 'react';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import { usePermission } from '../../../contexts/AuthorizationContext';
import UsersPage from './UsersPage';

function UsersRoute() {
	const canViewUserAdministration = usePermission('view-user-administration');

	if (!canViewUserAdministration) {
		return <NotAuthorizedPage />;
	}
	const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

	const useQuery = ({ text, itemsPerPage, current }, sortFields) =>
		useMemo(
			() => ({
				fields: JSON.stringify({
					name: 1,
					username: 1,
					emails: 1,
					roles: 1,
					status: 1,
					avatarETag: 1,
					active: 1,
				}),
				query: JSON.stringify({
					$or: [
						{ 'emails.address': { $regex: text || '', $options: 'i' } },
						{ username: { $regex: text || '', $options: 'i' } },
						{ name: { $regex: text || '', $options: 'i' } },
					],
				}),
				sort: JSON.stringify(
					sortFields.reduce((agg, [column, direction]) => {
						agg[column] = sortDir(direction);
						return agg;
					}, {}),
				),
				...(itemsPerPage && { count: itemsPerPage }),
				...(current && { offset: current }),
			}),
			[text, itemsPerPage, current, sortFields],
		);

	return <UsersPage useQuery={useQuery} />;
}

export default UsersRoute;
