import { StatusBullet } from '@rocket.chat/fuselage';
import React, { memo, ComponentProps, ReactElement } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';

type UserStatusProps = {
	small?: boolean;
} & ComponentProps<typeof StatusBullet>;

const UserStatus = ({ small, status, ...props }: UserStatusProps): ReactElement => {
	const size = small ? 'small' : 'large';
	const t = useTranslation();
	switch (status) {
		case 'online':
			return <StatusBullet size={size} status={status} title={t('Online')} {...props} />;
		case 'busy':
			return <StatusBullet size={size} status={status} title={t('Busy')} {...props} />;
		case 'away':
			return <StatusBullet size={size} status={status} title={t('Away')} {...props} />;
		case 'offline':
			return <StatusBullet size={size} status={status} title={t('Offline')} {...props} />;
		default:
			return <StatusBullet size={size} title={t('Loading')} {...props} />;
	}
};

export default memo(UserStatus);
