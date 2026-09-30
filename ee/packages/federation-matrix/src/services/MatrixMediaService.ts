import crypto from 'crypto';

import type { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails';
import { Upload } from '@rocket.chat/core-services';
import type { IUpload } from '@rocket.chat/core-typings';
import { FederationRequestError, federationSDK } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Avatars, Uploads } from '@rocket.chat/models';

const logger = new Logger('federation-matrix:media-service');

export class RemoteMediaFetchError extends Error {
	constructor(fileId: string, cause: unknown) {
		super(`Failed to fetch remote media for upload ${fileId}`, { cause });
		this.name = 'RemoteMediaFetchError';
	}
}

const isMissingOnOrigin = (err: unknown): boolean =>
	err instanceof Error && err.cause instanceof FederationRequestError && err.cause.response.status === 404;

export class MatrixMediaService {
	private static readonly pendingDownloads = new Map<string, Promise<IUpload | null>>();

	static generateMXCUri(fileId: string, serverName: string): string {
		return `mxc://${serverName}/${fileId}`;
	}

	static parseMXCUri(mxcUri: string): { serverName: string; mediaId: string } | null {
		const match = mxcUri.match(/^mxc:\/\/([^/]+)\/(.+)$/);
		if (!match) {
			logger.error({ mxcUri, msg: 'Invalid MXC URI format' });
			return null;
		}
		return {
			serverName: match[1],
			mediaId: match[2],
		};
	}

	static async prepareLocalFileForMatrix(fileId: string, serverName: string, matrixRoomId: string): Promise<string> {
		try {
			const file = await Uploads.findOneById(fileId);
			if (!file) {
				logger.error({ msg: 'File not found in database', fileId });
				throw new Error(`File ${fileId} not found`);
			}

			if (file.federation?.mxcUri) {
				return file.federation.mxcUri;
			}

			const mxcUri = this.generateMXCUri(fileId, serverName);

			await Uploads.setFederationInfo(fileId, {
				mrid: matrixRoomId,
				mxcUri,
				serverName,
				mediaId: fileId,
			});

			return mxcUri;
		} catch (err) {
			logger.error({ msg: 'Error preparing file for Matrix', err });
			throw err;
		}
	}

	/**
	 * With `fetchRemote`, a remote file nobody has opened yet is fetched from its origin first, and a
	 * failed fetch throws RemoteMediaFetchError. Without it only files this server holds are returned,
	 * which is what the federation API may serve.
	 */
	static async getLocalFileForMatrixNode(
		mediaId: string,
		serverName: string,
		{ fetchRemote = false }: { fetchRemote?: boolean } = {},
	): Promise<IUpload | null> {
		let file: IUpload | null;
		try {
			// try to find an avatar with the given mediaId as etag first, the index tends to be smaller
			const avatarFile = await Avatars.findOneByETag(mediaId);
			if (avatarFile) {
				return avatarFile;
			}

			file = (await Uploads.findByFederationMediaIdAndServerName(mediaId, serverName)) ?? (await Uploads.findOneById(mediaId));
		} catch (err) {
			logger.error({ msg: 'Error retrieving local file', err });
			return null;
		}

		if (!file || file.complete || !file.federation?.mxcUri) {
			return file;
		}

		return fetchRemote ? this.materializePendingFile(file._id) : null;
	}

	static async uploadFromAppService(params: {
		buffer: Buffer;
		fileName: string;
		mimeType: string;
		userId: string;
	}): Promise<{ mediaId: string; mxcUri: string }> {
		try {
			const serverName = federationSDK.getConfig('serverName');
			const mediaId = crypto.randomUUID().replace(/-/g, ''); // TODO maybe change to @rocket.chat/random ?
			const mxcUri = this.generateMXCUri(mediaId, serverName);

			await Upload.uploadFile({
				userId: params.userId,
				buffer: params.buffer,
				details: {
					name: params.fileName,
					size: params.buffer.length,
					type: params.mimeType,
					rid: '',
					userId: params.userId,
				},
				federation: {
					mxcUri,
					mrid: '',
					serverName,
					mediaId,
				},
			});

			return { mediaId, mxcUri };
		} catch (err) {
			logger.error({ msg: 'Error uploading file from app service', err });
			throw err;
		}
	}

	/** Records a remote file from its event without fetching it; materializePendingFile fetches it on first access. */
	static async registerRemoteFile(mxcUri: string, matrixRoomId: string, metadata: IUploadDetails): Promise<string> {
		const parts = this.parseMXCUri(mxcUri);
		if (!parts) {
			throw new Error('Invalid MXC URI');
		}

		const uploadAlreadyExists = await Uploads.findByFederationMediaIdAndServerName(parts.mediaId, parts.serverName);
		if (uploadAlreadyExists) {
			if (!uploadAlreadyExists.rid && metadata.rid) {
				await Uploads.setFederationRoomInfo(uploadAlreadyExists._id, metadata.rid, matrixRoomId);
			}
			return uploadAlreadyExists._id;
		}

		const file = await Upload.createPendingFile({
			userId: metadata.userId || 'federation',
			details: metadata,
			federation: {
				mxcUri,
				mrid: matrixRoomId,
				serverName: parts.serverName,
				mediaId: parts.mediaId,
			},
		});

		return file._id;
	}

	static async materializePendingFile(fileId: string): Promise<IUpload | null> {
		const inFlight = this.pendingDownloads.get(fileId);
		if (inFlight) {
			return inFlight;
		}

		const download = (async (): Promise<IUpload | null> => {
			const file = await Uploads.findOneById(fileId);
			if (!file) {
				return null;
			}

			if (file.complete) {
				return file;
			}

			const { serverName, mediaId } = file.federation ?? {};
			if (!serverName || !mediaId) {
				return null;
			}

			logger.debug({ msg: 'Fetching federated file on first access', fileId, serverName, mediaId });

			try {
				await Upload.checkPendingFile({ fileId });

				const buffer = await federationSDK.downloadFromRemoteServer(serverName, mediaId);
				if (!buffer) {
					throw new Error('Download from remote server returned null content.');
				}

				return await Upload.completePendingFile({ fileId, buffer });
			} catch (err) {
				if (isMissingOnOrigin(err)) {
					return null;
				}
				throw new RemoteMediaFetchError(fileId, err);
			}
		})().finally(() => {
			this.pendingDownloads.delete(fileId);
		});

		this.pendingDownloads.set(fileId, download);

		return download;
	}

	static async getLocalFileBuffer(file: IUpload): Promise<Buffer> {
		return Upload.getFileBuffer({ file });
	}
}
