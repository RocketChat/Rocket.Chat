import { appendFileSync } from 'fs';

export const writeToFile = (fileName: string, content: string | Uint8Array) => {
	appendFileSync(fileName, content);
};
