import { applyStatusChange } from './applyStatusChange';
import { cancelUpcomingStatusChanges } from './cancelUpcomingStatusChanges';
import { generateCronJobId } from './generateCronJobId';
import { handleOverlappingEvents } from './handleOverlappingEvents';
import { removeCronJobs } from './removeCronJobs';

export const statusEventManager = {
	applyStatusChange,
	cancelUpcomingStatusChanges,
	generateCronJobId,
	handleOverlappingEvents,
	removeCronJobs,
} as const;
