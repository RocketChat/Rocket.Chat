import type { AppPermission } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

const defaultPermissions = [
	'user.read',
	'user.write',
	'upload.read',
	'upload.write',
	'ui.interact',
	'server-setting.read',
	'server-setting.write',
	'room.read',
	'room.write',
	'message.read',
	'message.write',
	'livechat-department.read',
	'livechat-department.write',
	'livechat-room.read',
	'livechat-room.write',
	'livechat-message.read',
	'livechat-message.write',
	'livechat-visitor.read',
	'livechat-visitor.write',
	'livechat-status.read',
	'livechat-custom-fields.write',
	'scheduler',
	'networking',
	'persistence',
	'env.read',
	'slashcommand',
	'api',
];

const AppPermissionsList = ({ appPermissions }: { appPermissions: AppPermission[] | undefined }): ReactElement => {
	const { t } = useTranslation();
	const handleAppPermissions = (permission: string): string => t(`Apps_Permissions_${permission.replace('.', '_')}` as TranslationKey);

	if (appPermissions?.length) {
		return (
			<>
				{appPermissions.map((permission) => (
					<Fragment key={permission.name}>
						<li>{handleAppPermissions(permission.name)}</li>
						{permission.required && (
							<Box is='span' color='status-font-on-danger'>
								({t('required')})
							</Box>
						)}
					</Fragment>
				))}
			</>
		);
	}

	return (
		<>
			{defaultPermissions.map((permission) => (
				<Fragment key={permission}>
					<li>{handleAppPermissions(permission)}</li>
				</Fragment>
			))}
		</>
	);
};

export default AppPermissionsList;
