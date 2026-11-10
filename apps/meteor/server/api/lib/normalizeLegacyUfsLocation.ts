import type { IUpload } from '@rocket.chat/core-typings';

// Uploads stored before the `/ufs` route was removed keep `/ufs/<Store>:Uploads/<id>/<name>` in the database.
const LEGACY_UFS_LOCATION = /\/ufs\/[^/:]+:Uploads\/.*$/;

export const normalizeLegacyUfsLocation = <T extends Pick<IUpload, '_id' | 'name' | 'path' | 'url'>>(file: T): T => {
	const { path, url } = file;
	const isLegacyPath = !!path && LEGACY_UFS_LOCATION.test(path);
	const isLegacyUrl = !!url && LEGACY_UFS_LOCATION.test(url);

	if (!isLegacyPath && !isLegacyUrl) {
		return file;
	}

	const current = `/file-upload/${file._id}/${encodeURIComponent(file.name || '')}`;

	return {
		...file,
		...(isLegacyPath && { path: current }),
		...(isLegacyUrl && { url: url.replace(LEGACY_UFS_LOCATION, current) }),
	};
};
