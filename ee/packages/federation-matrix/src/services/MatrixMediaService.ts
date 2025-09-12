import type { HomeserverServices } from '@hs/federation-sdk';
import { Upload } from '@rocket.chat/core-services';
import type { IUpload } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Uploads } from '@rocket.chat/models';

const logger = new Logger('federation-matrix:media-service');

export interface IRemoteFileReference {
	name: string;
	size: number;
	type: string;
	mxcUri: string;
	serverName: string;
	mediaId: string;
}

export class MatrixMediaService {
	private static homeserverServices: HomeserverServices;

	static setHomeserverServices(services: HomeserverServices): void {
		this.homeserverServices = services;
	}

	static generateMXCUri(fileId: string, serverName: string): string {
		return `mxc://${serverName}/${fileId}`;
	}

	static parseMXCUri(mxcUri: string): { serverName: string; mediaId: string } | null {
		const match = mxcUri.match(/^mxc:\/\/([^/]+)\/(.+)$/);
		if (!match) {
			logger.error('Invalid MXC URI format', { mxcUri });
			return null;
		}
		return {
			serverName: match[1],
			mediaId: match[2],
		};
	}

	static async prepareLocalFileForMatrix(fileId: string, serverName: string): Promise<string> {
		try {
			const file = await Uploads.findOneById(fileId);
			if (!file) {
				logger.error(`File ${fileId} not found in database`);
				throw new Error(`File ${fileId} not found`);
			}

			if (file.federation?.mxcUri) {
				return file.federation.mxcUri;
			}

			const mxcUri = this.generateMXCUri(fileId, serverName);

			await Uploads.setFederationInfo(fileId, {
				mxcUri,
				serverName,
				mediaId: fileId,
			});

			return mxcUri;
		} catch (error) {
			logger.error('Error preparing file for Matrix:', error);
			throw error;
		}
	}

	static async getLocalFileForMatrixNode(mediaId: string, serverName: string): Promise<IUpload | null> {
		try {
			let file = await Uploads.findByFederationMediaIdAndServerName(mediaId, serverName);

			if (!file) {
				file = await Uploads.findOneById(mediaId);
			}

			if (!file) {
				return null;
			}

			return file;
		} catch (error) {
			logger.error('Error retrieving local file:', error);
			return null;
		}
	}

	static async downloadAndStoreRemoteFile(
		mxcUri: string,
		metadata: {
			name: string;
			size: number;
			type: string;
			messageId?: string;
			roomId?: string;
			userId?: string;
		},
	): Promise<string> {
		try {
			const parts = this.parseMXCUri(mxcUri);
			if (!parts) {
				logger.error('Invalid MXC URI format', { mxcUri });
				throw new Error('Invalid MXC URI');
			}

			const uploadAlreadyExists = await Uploads.findByFederationMxcUri(mxcUri);
			if (uploadAlreadyExists) {
				return uploadAlreadyExists._id;
			}

			if (!this.homeserverServices) {
				throw new Error('Homeserver services not initialized. Call setHomeserverServices first.');
			}

			const buffer = await this.homeserverServices.media.downloadFromRemoteServer(parts.serverName, parts.mediaId);

			const uploadedFile = await Upload.uploadFile({
				userId: metadata.userId || 'federation',
				buffer,
				details: {
					name: metadata.name || 'unnamed',
					size: buffer.length,
					type: metadata.type || 'application/octet-stream',
					rid: metadata.roomId,
					userId: metadata.userId || 'federation',
				},
			});

			await Uploads.setFederationInfo(uploadedFile._id, {
				mxcUri,
				serverName: parts.serverName,
				mediaId: parts.mediaId,
			});

			return uploadedFile._id;
		} catch (error) {
			logger.error('Error downloading and storing remote file:', error);
			throw error;
		}
	}

	static async getLocalFileBuffer(file: IUpload): Promise<Buffer> {
		return Upload.getFileBuffer({ file });
	}
}
