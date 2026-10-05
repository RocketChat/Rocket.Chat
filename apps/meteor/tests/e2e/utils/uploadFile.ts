import fs from 'node:fs';

import type { APIRequestContext } from 'playwright-core';

import { BASE_API_URL } from '../config/constants';
import type { IUserState } from '../fixtures/userStates';

type UploadFileOptions = { msg?: string; description?: string; tmid?: string };

export const uploadFileToRoom = async (
	request: APIRequestContext,
	user: IUserState,
	rid: string,
	fileName: string,
	options: UploadFileOptions = {},
) => {
	const headers = { 'X-Auth-Token': user.data.loginToken, 'X-User-Id': user.data._id };
	const filePath = `./tests/e2e/fixtures/files/${fileName}`;

	const upload = await request.post(`${BASE_API_URL}/rooms.media/${rid}`, {
		headers,
		multipart: { file: fs.createReadStream(filePath) },
	});
	if (!upload.ok()) {
		throw new Error(`Unable to upload ${fileName} [http status: ${upload.status()}]`, { cause: await upload.json() });
	}
	const { file } = await upload.json();

	const confirm = await request.post(`${BASE_API_URL}/rooms.mediaConfirm/${rid}/${file._id}`, { headers, data: options });
	if (!confirm.ok()) {
		throw new Error(`Unable to confirm upload of ${fileName} [http status: ${confirm.status()}]`, { cause: await confirm.json() });
	}

	return (await confirm.json()).message;
};
