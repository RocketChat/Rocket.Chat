import { createWriteStream } from 'fs';

import archiver from 'archiver';

export const makeZipFile = (folderToZip: string, targetFile: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		const output = createWriteStream(targetFile);

		const archive = archiver('zip');

		output.on('close', () => resolve());

		archive.on('error', (error) => reject(error));

		archive.pipe(output);
		archive.directory(folderToZip, false);
		archive.finalize();
	});
};
