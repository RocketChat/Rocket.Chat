import { Upload } from '@rocket.chat/core-services';
import type { IUpload } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Uploads } from '@rocket.chat/models';
import fetch from 'node-fetch';

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
				logger.debug('File already has MXC URI', {
					fileId,
					mxcUri: file.federation.mxcUri,
				});
				return file.federation.mxcUri;
			}

			const mxcUri = this.generateMXCUri(fileId, serverName);

			await Uploads.updateOne(
				{ _id: fileId },
				{
					$set: {
						'federation.type': 'matrix',
						'federation.mxcUri': mxcUri,
						'federation.isRemote': false,
						'federation.serverName': serverName,
						'federation.mediaId': fileId,
					},
				},
			);

			return mxcUri;
		} catch (error) {
			logger.error('Error preparing file for Matrix:', error);
			throw error;
		}
	}

	static async getLocalFileForMatrixNode(mxcUri: string): Promise<IUpload | null> {
		try {
			const parts = this.parseMXCUri(mxcUri);
			if (!parts) {
				return null;
			}

			let file = await Uploads.findOne({
				'federation.mxcUri': mxcUri,
				'federation.isRemote': false,
			});

			if (!file) {
				file = await Uploads.findOneById(parts.mediaId);
			}

			if (!file) {
				logger.warn('Local file not found for MXC URI', { mxcUri });
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

			const buffer = await this.downloadFromMatrixServer(parts.serverName, parts.mediaId);

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

			await Uploads.updateOne(
				{ _id: uploadedFile._id },
				{
					$set: {
						'federation.type': 'matrix',
						'federation.mxcUri': mxcUri,
						'federation.serverName': parts.serverName,
						'federation.mediaId': parts.mediaId,
						'federation.originalUrl': mxcUri,
					},
				},
			);

			return uploadedFile._id;
		} catch (error) {
			logger.error('Error downloading and storing remote file:', error);
			throw error;
		}
	}

	private static async downloadFromMatrixServer(serverName: string, mediaId: string): Promise<Buffer> {
		try {
			// try different endpoints in order of preference
			// according to MSC3916, new authenticated federation endpoints don't include server name in path
			// first try new authenticated federation endpoints, then fall back to legacy endpoints
			const endpoints = [
				`https://${serverName}/_matrix/federation/v1/media/download/${mediaId}`,
				`https://${serverName}/federation/v1/media/download/${mediaId}`,
				// legacy endpoints (deprecated but still needed for backwards compatibility)
				`https://${serverName}/_matrix/media/v3/download/${serverName}/${mediaId}`,
				`https://${serverName}/_matrix/media/r0/download/${serverName}/${mediaId}`,
			];

			for await (const endpoint of endpoints) {
				try {
					const response = await fetch(endpoint, {
						method: 'GET',
						timeout: 15000, // 15 seconds timeout per endpoint
						headers: {
							'User-Agent': 'Rocket.Chat Federation',
							'Accept': '*/*',
						},
					});

					if (response.ok) {
						return response.buffer();
					}

					logger.debug('Non-OK response from endpoint', {
						endpoint,
						status: response.status,
						statusText: response.statusText,
					});
				} catch (error) {
					logger.error('Error downloading from Matrix server:', error);
				}
			}

			throw new Error(`Failed to download file from Matrix server ${serverName}/${mediaId}`);
		} catch (error) {
			logger.error('Error downloading from Matrix server:', error);
			throw error;
		}
	}

	static async getLocalFileBuffer(fileId: string): Promise<Buffer | null> {
		try {
			const fileRecord = await Uploads.findOneById(fileId);
			if (!fileRecord || fileRecord.federation) {
				return null;
			}
			return await Upload.getFileBuffer({ file: fileRecord });
		} catch (error) {
			logger.error('Error retrieving file buffer:', error);
			return null;
		}
	}
}
