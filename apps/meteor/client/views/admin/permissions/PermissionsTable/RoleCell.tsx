import type { IRole } from '@rocket.chat/core-typings';
import { Margins, Box, CheckBox, Throbber } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { useState, memo } from 'react';

import { AuthorizationUtils } from '../../../../../app/authorization/lib';
import { GenericTableCell } from '../../../../components/GenericTable';

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

	const handleChange = useEffectEvent(async () => {
		setLoading(true);
		const result = await onChange(_id, granted);
		setGranted(result);
		setLoading(false);
	});

	const isDisabled = !!loading || !!isRestrictedForRole;

	return (
		<GenericTableCell withTruncatedText>
			<Margins inline={2}>
				<CheckBox checked={granted} onChange={handleChange} disabled={isDisabled} />
				{!loading && (
					<Box display='inline' color='hint' invisible={!lineHovered}>
						{description || name}
					</Box>
				)}
				{loading && <Throbber size='x12' display='inline-block' />}
			</Margins>
		</GenericTableCell>
	);
};

export default memo(RoleCell);
