import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type UserStatusDisabledInfoProps = { workspace: boolean };

const UserStatusDisabledInfo = ({ workspace }: UserStatusDisabledInfoProps) => {
	const { t } = useTranslation();

	return (
		<Box display='flex' title={workspace ? t('User_status_disabled_on_this_workspace') : t('User_status_disabled_by_an_admin')}>
			<Icon name='info-circled' size='x20' color='info' />
		</Box>
	);
};

export default UserStatusDisabledInfo;
