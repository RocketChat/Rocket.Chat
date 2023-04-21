import fs from 'fs';

export const getPathFromTranslationFile = (language: string): string => Assets.absoluteFilePath(`i18n/${language}.i18n.json`);
export const getSupportedLanguages = async (): Promise<string[]> =>
	new Promise((resolve, reject) => {
		try {
			fs.readdir(`${Assets.getServerDir()}/assets/app/locales`, (err, files) => {
				if (err) {
					return reject(err);
				}
				resolve(files.map((file) => file.split('.')[0]));
			});
		} catch {
			resolve([]);
		}
	});
