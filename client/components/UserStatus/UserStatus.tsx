import { StatusBullet, StatusBulletProps } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';

export type UserStatusProps = {
	small?: boolean;
} & StatusBulletProps;

const UserStatus: FC<UserStatusProps> = ({ small, status, ...props }) => {
	const t = useTranslation();
	const size = small ? 'small' : 'large';

	switch (status) {
		case 'online':
			return <StatusBullet size={size} status={status} title={t('Online')} {...props}/>;
		case 'busy':
			return <StatusBullet size={size} status={status} title={t('Busy')} {...props}/>;
		case 'away':
			return <StatusBullet size={size} status={status} title={t('Away')} {...props}/>;
		case 'offline':
			return <StatusBullet size={size} status={status} title={t('Offline')} {...props}/>;
		default:
			return <StatusBullet size={size} title={t('Loading')} {...props}/>;
	}
};

export default memo(UserStatus);
