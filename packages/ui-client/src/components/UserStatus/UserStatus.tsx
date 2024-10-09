import { StatusBullet } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import { memo } from 'react';

export type UserStatusProps = {
	small?: boolean;
} & ComponentProps<typeof StatusBullet>;

function UserStatus({ small, status, ...props }: UserStatusProps): ReactElement {
	const t = useTranslation();
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
