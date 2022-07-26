import { existsSync, mkdirSync } from 'fs';

export const createDir = (folderName: string): void => {
	if (!existsSync(folderName)) {
		mkdirSync(folderName, { recursive: true });
	}
};
