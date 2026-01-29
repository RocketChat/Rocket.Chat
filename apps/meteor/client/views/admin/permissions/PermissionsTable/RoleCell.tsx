import type { IRole } from '@rocket.chat/core-typings';
import { Margins, Box, CheckBox, Throbber } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericModal, GenericTableCell } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthorizationUtils, confirmationRequiredPermissions } from '../../../../../app/authorization/lib';

type RoleCellProps = {
	_id: IRole['_id'];
	name: IRole['name'];
	description: IRole['description'];
	onChange: (roleId: IRole['_id'], granted: boolean) => Promise<boolean>;
	permissionId: string;
	permissionName: string;
	grantedRoles: IRole['_id'][];
};

const RoleCell = ({ _id, name, description, onChange, permissionId, permissionName, grantedRoles = [] }: RoleCellProps): ReactElement => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const [granted, setGranted] = useState(() => !!grantedRoles.includes(_id));
	const [loading, setLoading] = useState(false);

	const isRestrictedForRole = AuthorizationUtils.isPermissionRestrictedForRole(permissionId, _id);
	const shouldDisplayConfirmation = confirmationRequiredPermissions.includes(permissionId) && grantedRoles.length === 1 && granted;

	const handleChange = useEffectEvent(() => {
		if (shouldDisplayConfirmation) {
			const handleSubmit = () => {
				handleConfirmChange();
				setModal(null);
			};

			return setModal(
				<GenericModal onConfirm={handleSubmit} onCancel={() => setModal(null)} confirmText={t('Remove')} variant='danger'>
					{t('Last_role_in_permission_warning')}
				</GenericModal>,
			);
		}

		return handleConfirmChange();
	});

	const handleConfirmChange = useEffectEvent(async () => {
		setLoading(true);
		const result = await onChange(_id, granted);
		setGranted(result);
		setLoading(false);
	});

	const isDisabled = !!loading || !!isRestrictedForRole;
	const checkboxLabel = `${permissionName} - ${description || name}`;

	return (
		<GenericTableCell withTruncatedText>
			<Margins inline={2}>
				<CheckBox aria-label={checkboxLabel} checked={granted} onChange={handleChange} disabled={isDisabled} />
				{!loading && (
					<Box display='inline' color='hint' invisible>
						{description || name}
					</Box>
				)}
				{loading && <Throbber size='x12' display='inline-block' />}
			</Margins>
		</GenericTableCell>
	);
};

export default memo(RoleCell);
