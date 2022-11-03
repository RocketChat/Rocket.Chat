import { IRole } from '@rocket.chat/core-typings';
import { TableCell, Margins, Box, CheckBox, Throbber } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, memo, ReactElement } from 'react';

import { AuthorizationUtils } from '../../../../../app/authorization/lib';

type RoleCellProps = {
	_id: IRole['_id'];
	name: IRole['name'];
	description: IRole['description'];
	onChange: (roleId: IRole['_id'], granted: boolean) => Promise<boolean>;
	lineHovered: boolean;
	permissionId: string;
	grantedRoles: IRole['_id'][];
};

const RoleCell = ({ _id, name, description, onChange, lineHovered, permissionId, grantedRoles = [] }: RoleCellProps): ReactElement => {
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
		<TableCell withTruncatedText>
			<Margins inline='x2'>
				<CheckBox checked={granted} onChange={handleChange} disabled={isDisabled} />
				{!loading && (
					<Box display='inline' color='hint' invisible={!lineHovered}>
						{description || name}
					</Box>
				)}
				{loading && <Throbber size='x12' display='inline-block' />}
			</Margins>
		</TableCell>
	);
};

export default memo(RoleCell);
