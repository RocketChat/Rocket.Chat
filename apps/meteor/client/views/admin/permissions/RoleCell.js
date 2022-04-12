import { Table, Margins, Box, CheckBox, Throbber } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, memo } from 'react';

import { AuthorizationUtils } from '../../../../app/authorization/lib';

const RoleCell = ({ grantedRoles = [], _id, name, description, onChange, lineHovered, permissionId }) => {
	const [granted, setGranted] = useState(() => !!grantedRoles.includes(_id));
	const [loading, setLoading] = useState(false);

	const isRestrictedForRole = AuthorizationUtils.isPermissionRestrictedForRole(permissionId, _id);

	const handleChange = useMutableCallback(async () => {
		setLoading(true);
		const result = await onChange(_id, granted);
		setGranted(result);
		setLoading(false);
	});

	const isDisabled = !!loading || !!isRestrictedForRole;

	return (
		<Table.Cell withTruncatedText>
			<Margins inline='x2'>
				<CheckBox checked={granted} onChange={handleChange} disabled={isDisabled} />
				{!loading && (
					<Box display='inline' color='hint' invisible={!lineHovered}>
						{description || name}
					</Box>
				)}
				{loading && <Throbber size='x12' display='inline-block' />}
			</Margins>
		</Table.Cell>
	);
};

export default memo(RoleCell);
