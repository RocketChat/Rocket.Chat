import type { CronJobStatus } from '@rocket.chat/core-typings';
import type { Tag } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export const statusVariant = (status?: CronJobStatus): ComponentProps<typeof Tag>['variant'] => {
	switch (status) {
		case 'running':
			return 'primary';
		case 'scheduled':
			return 'secondary-info';
		case 'completed':
			return 'featured';
		case 'failed':
			return 'danger';
		case 'disabled':
			return 'warning';
		default:
			return undefined;
	}
};
