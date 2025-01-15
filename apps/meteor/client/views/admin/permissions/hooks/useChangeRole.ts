import type { IRole, IPermission } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';

export const useChangeRole = ({
	onGrant,
	onRemove,
	permissionId,
}: {
	onGrant: (permissionId: IPermission['_id'], roleId: IRole['_id']) => Promise<void>;
	onRemove: (permissionId: IPermission['_id'], roleId: IRole['_id']) => Promise<void>;
	permissionId: IPermission['_id'];
}): ((roleId: IRole['_id'], granted: boolean) => Promise<boolean>) => {
	const dispatchToastMessage = useToastMessageDispatch();

	return useEffectEvent(async (roleId: IRole['_id'], granted: boolean) => {
		try {
			if (granted) {
				await onRemove(permissionId, roleId);
			} else {
				await onGrant(permissionId, roleId);
			}
			return !granted;
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
		return granted;
	});
};
