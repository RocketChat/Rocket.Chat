import { StatusBullet } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

export type UserStatusProps = {
	small?: boolean;
} & ComponentPropsWithoutRef<typeof StatusBullet>;

function UserStatus({ small, status, ...props }: UserStatusProps) {
	const { t } = useTranslation();
	const size = small ? 'small' : 'large';

	switch (status) {
		case 'online':
			return <StatusBullet size={size} status={status} {...props} />;
		case 'busy':
			return <StatusBullet size={size} status={status} {...props} />;
		case 'away':
			return <StatusBullet size={size} status={status} {...props} />;
		case 'offline':
			return <StatusBullet size={size} status={status} {...props} />;
		case 'disabled':
			return <StatusBullet size={size} status={status} {...props} />;
		default:
			return <StatusBullet size={size} title={t('Loading')} {...props} />;
	}
}

export default memo(UserStatus);
