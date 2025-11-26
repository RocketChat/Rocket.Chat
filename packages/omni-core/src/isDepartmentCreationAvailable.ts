import { LivechatDepartment } from '@rocket.chat/models';
import { makeFunction } from '@rocket.chat/patch-injection';

export const isDepartmentCreationAvailable = makeFunction(async (): Promise<boolean> => 
	// Only one department can exist at a time
	 (await LivechatDepartment.countTotal()) === 0
);
