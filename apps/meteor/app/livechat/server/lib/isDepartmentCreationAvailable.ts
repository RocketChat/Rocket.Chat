import { LivechatDepartment } from '@rocket.chat/models';
import { makeFunction } from '@rocket.chat/patch-coordinator';

export const isDepartmentCreationAvailable = makeFunction(async (): Promise<boolean> => {
	// Only one department can exist at a time
	return (await LivechatDepartment.countTotal()) === 0;
});
