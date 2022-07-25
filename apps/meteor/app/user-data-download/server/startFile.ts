import { writeFileSync } from 'fs';

export const startFile = (fileName: string, content: string | NodeJS.ArrayBufferView) => {
	writeFileSync(fileName, content);
};
