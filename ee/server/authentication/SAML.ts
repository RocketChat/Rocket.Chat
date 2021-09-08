import { callbacks } from '../../../app/callbacks/server';
import { onLicense } from '../../app/license/server';

onLicense('SAML-enterprise', () => {
	callbacks.add('SAML-rolesync', ({ updateData, globalRoles }: {updateData: Record<string, any>; globalRoles: Array<string>}) => {
		updateData.roles = globalRoles;
	});
});
