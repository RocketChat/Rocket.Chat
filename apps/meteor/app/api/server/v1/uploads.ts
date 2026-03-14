import { Upload } from '@rocket.chat/core-services';
import type { IUpload } from '@rocket.chat/core-typings';
import { Messages, Uploads, Users } from '@rocket.chat/models';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateNotFoundErrorResponse,
} from '@rocket.chat/rest-typings';

import os from 'os';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { Random } from '@rocket.chat/random';
import { FileUpload } from '../../../file-upload/server';
import { MultipartUploadHandler } from '../lib/MultipartUploadHandler';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';

const mkdir = fs.promises.mkdir;
const readdir = fs.promises.readdir;
const readFile = fs.promises.readFile;
const writeFile = fs.promises.writeFile;
const unlink = fs.promises.unlink;
const rename = fs.promises.rename;
const stat = fs.promises.stat;
const appendFile = fs.promises.appendFile;
const rmdir = fs.promises.rmdir;

const TEMP_UPLOAD_DIR = path.join(os.tmpdir(), 'rocketchat-resumable-uploads');

const ensureTempDir = async () => {
	try {
		await mkdir(TEMP_UPLOAD_DIR, { recursive: true });
	} catch (e: any) {
		if (e.code !== 'EEXIST') {
			console.error(`Failed to create temporary upload directory: ${TEMP_UPLOAD_DIR}`, e);
			throw new Error(`Failed to create temporary upload directory: ${e.message}`);
		}
	}
};

type UploadsDeleteResult = {
	/**
	 * The list of files that were successfully removed; May include additional files such as image thumbnails
	 * */
	deletedFiles: IUpload['_id'][];
};

type UploadsDeleteParams = {
	fileId: string;
};

const uploadsDeleteParamsSchema = {
	type: 'object',
	properties: {
		fileId: {
			type: 'string',
		},
	},
	required: ['fileId'],
	additionalProperties: false,
};

export const isUploadsDeleteParams = ajv.compile<UploadsDeleteParams>(uploadsDeleteParamsSchema);

const uploadsDeleteEndpoint = API.v1.post(
	'uploads.delete',
	{
		authRequired: true,
		body: isUploadsDeleteParams,
		response: {
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			404: validateNotFoundErrorResponse,
			200: ajv.compile<UploadsDeleteResult>({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
					},
					deletedFiles: {
						description: 'The list of files that were successfully removed. May include additional files such as image thumbnails',
						type: 'array',
						items: {
							type: 'string',
						},
					},
				},
				required: ['deletedFiles'],
				additionalProperties: false,
			}),
		},
	},
	async function action() {
		const { fileId } = this.bodyParams;

		const file = await Uploads.findOneById(fileId);
		if (!file?.userId || !file.rid) {
			return API.v1.notFound();
		}

		const msg = await Messages.getMessageByFileId(fileId);

		const user = await Users.findOneById(this.userId);
		// Safeguard, can't really happen
		if (!user) {
			return API.v1.forbidden('forbidden');
		}

		if (!(await Upload.canDeleteFile(user, file, msg))) {
			return API.v1.forbidden('forbidden');
		}

		const { deletedFiles } = await Upload.deleteFile(user, fileId, msg);
		return API.v1.success({
			deletedFiles,
		});
	},
);

const uploadsInitEndpoint = API.v1.post(
	'uploads/init',
	{
		authRequired: true,
		response: {
			200: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean' },
					uploadId: { type: 'string' },
				},
				required: ['success', 'uploadId'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
		},
	},
	async function action() {
		const { rid, fileName, fileSize, fileType, chunkSize } = this.bodyParams as any;

		if (!rid || !fileName || !fileSize || !fileType || !chunkSize) {
			return API.v1.failure('Missing required parameters');
		}

		if (!(await canAccessRoomIdAsync(this.userId, rid))) {
			return API.v1.failure('Unauthorized');
		}

		const uploadId = Random.id();
		const totalChunks = Math.ceil(fileSize / chunkSize);

		await Uploads.updateOne(
			{ _id: uploadId },
			{
				$set: {
					rid,
					userId: this.userId,
					name: fileName,
					size: fileSize,
					type: fileType,
					complete: false,
					uploading: true,
					resumable: {
					uploadId,
						chunkSize,
						totalChunks,
						uploadedChunks: [],
					},
					uploadedAt: new Date(),
				},
			},
			{ upsert: true },
		);

		await ensureTempDir();
		await mkdir(path.join(TEMP_UPLOAD_DIR, uploadId));

		return API.v1.success({
			uploadId,
		});
	},
);

const uploadsChunkEndpoint = API.v1.post(
	'uploads/chunk',
	{
		authRequired: true,
		response: {
			200: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const { uploadId, chunkIndex } = this.queryParams as any;

		if (!uploadId || typeof chunkIndex === 'undefined') {
			return API.v1.failure('Missing required parameters');
		}

		const session = (await Uploads.findOneById(uploadId as string)) as any;
		if (!session || session.userId !== this.userId || !session.resumable) {
			return API.v1.notFound();
		}

		const normalizedChunkIndex = Number(chunkIndex);
		if (!Number.isInteger(normalizedChunkIndex) || normalizedChunkIndex < 0 || normalizedChunkIndex >= session.resumable.totalChunks) {
			return API.v1.failure('Invalid chunk index');
		}

		const { file } = await MultipartUploadHandler.parseRequest(this.request, {
			field: 'chunkData',
			maxSize: session.resumable.chunkSize,
		});

		if (!file) {
			return API.v1.failure('No file uploaded');
		}

		if (file.size > session.resumable.chunkSize) {
			await MultipartUploadHandler.cleanup(file.tempFilePath);
			return API.v1.failure('Chunk size exceeds limit');
		}

		const chunkPath = path.resolve(TEMP_UPLOAD_DIR, uploadId as string, String(normalizedChunkIndex));
		if (!chunkPath.startsWith(path.resolve(TEMP_UPLOAD_DIR, uploadId as string))) {
			await MultipartUploadHandler.cleanup(file.tempFilePath);
			return API.v1.failure('Invalid path');
		}

		await rename(file.tempFilePath, chunkPath);

		// Validate cumulative size
		const chunkFiles = await readdir(path.join(TEMP_UPLOAD_DIR, uploadId as string));
		let cumulativeSize = 0;
		for (const cf of chunkFiles) {
			const chunkStat = await stat(path.join(TEMP_UPLOAD_DIR, uploadId as string, cf));
			cumulativeSize += chunkStat.size;
		}

		if (cumulativeSize > session.size) {
			await unlink(chunkPath);
			return API.v1.failure('Cumulative chunk size exceeds total file size');
		}

		await Uploads.updateOne({ _id: uploadId }, { $addToSet: { 'resumable.uploadedChunks': normalizedChunkIndex } });

		return API.v1.success();
	},
);

const uploadsCompleteEndpoint = API.v1.post(
	'uploads/complete',
	{
		authRequired: true,
		response: {
			200: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean' },
					file: { type: 'object', additionalProperties: true },
				},
				required: ['success', 'file'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const { uploadId } = this.bodyParams as any;

		if (!uploadId) {
			return API.v1.failure('Missing required parameters');
		}

		const session = (await Uploads.findOneById(uploadId)) as any;
		if (!session || session.userId !== this.userId || !session.resumable) {
			return API.v1.notFound();
		}

		if (!(await canAccessRoomIdAsync(this.userId, session.rid))) {
			return API.v1.failure('Unauthorized');
		}

		const sessionDir = path.join(TEMP_UPLOAD_DIR, uploadId);
		const finalPath = path.join(TEMP_UPLOAD_DIR, `${uploadId}.final`);

		const chunkFiles = await readdir(sessionDir);
		chunkFiles.sort((a, b) => Number(a) - Number(b));

		if (chunkFiles.length !== session.resumable.totalChunks) {
			return API.v1.failure('Missing chunks');
		}

		const writeStream = fs.createWriteStream(finalPath);
		try {
			for (const chunkFile of chunkFiles) {
				const chunkPath = path.join(sessionDir, chunkFile);
				const chunkContent = await readFile(chunkPath);
				const canContinue = writeStream.write(chunkContent);
				if (!canContinue) {
					await new Promise((resolve) => writeStream.once('drain', resolve));
				}
			}
			writeStream.end();
			await new Promise<void>((resolve, reject) => {
				writeStream.on('finish', resolve);
				writeStream.on('error', (err) => {
					console.error('Error writing final file:', err);
					reject(err);
				});
			});
		} catch (error) {
			writeStream.destroy();
			throw error;
		}

		const fileStream = fs.createReadStream(finalPath);
		const fileStore = FileUpload.getStore('Uploads');
		const details = {
			rid: session.rid,
			userId: session.userId,
			name: session.name,
			size: session.size,
			type: session.type,
			uploadedAt: new Date(),
		} as any;

		const uploadedFile = await fileStore.insert(details, fileStream);

		try {
			if (fs.existsSync(finalPath)) {
				await unlink(finalPath);
			}
			if (fs.existsSync(sessionDir)) {
				for (const chunkFile of chunkFiles) {
					await unlink(path.join(sessionDir, chunkFile));
				}
				await rmdir(sessionDir);
			}
		} catch (e) {
			console.error('Error during cleanup:', e);
		}
		await Uploads.deleteOne({ _id: uploadId });

		return API.v1.success({
			file: uploadedFile as any,
		});
	},
);

const uploadsCancelEndpoint = API.v1.post(
	'uploads/cancel',
	{
		authRequired: true,
		response: {
			200: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const { uploadId } = this.bodyParams as any;

		if (!uploadId) {
			return API.v1.failure('Missing required parameters');
		}

		const session = (await Uploads.findOneById(uploadId)) as any;
		if (!session || session.userId !== this.userId || !session.resumable) {
			return API.v1.notFound();
		}

		const sessionDir = path.join(TEMP_UPLOAD_DIR, uploadId);
		if (fs.existsSync(sessionDir)) {
			const chunkFiles = await readdir(sessionDir);
			for (const chunkFile of chunkFiles) {
				await unlink(path.join(sessionDir, chunkFile));
			}
			await rmdir(sessionDir);
		}

		await Uploads.deleteOne({ _id: uploadId });

		return API.v1.success();
	},
);

type UploadsEndpoints =
	| ExtractRoutesFromAPI<typeof uploadsDeleteEndpoint>
	| ExtractRoutesFromAPI<typeof uploadsInitEndpoint>
	| ExtractRoutesFromAPI<typeof uploadsChunkEndpoint>
	| ExtractRoutesFromAPI<typeof uploadsCompleteEndpoint>
	| ExtractRoutesFromAPI<typeof uploadsCancelEndpoint>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends UploadsEndpoints {}
}
