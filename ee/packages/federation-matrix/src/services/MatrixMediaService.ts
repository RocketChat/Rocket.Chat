import crypto from 'crypto';

import { Upload } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { Uploads, Subscriptions, Settings } from '@rocket.chat/models';

import type { IUploadWithFederation } from '../types/IUploadWithFederation';

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

	static async getLocalFileForMatrixNode(mxcUri: string): Promise<IUploadWithFederation | null> {
		try {
			const parts = this.parseMXCUri(mxcUri);
			if (!parts) {
				return null;
			}

			let file = (await Uploads.findOne({
				'federation.mxcUri': mxcUri,
				'federation.isRemote': false,
			})) as IUploadWithFederation | null;

			if (!file) {
				file = (await Uploads.findOneById(parts.mediaId)) as IUploadWithFederation | null;
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

	static async createI(
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

			const existing = await Uploads.findOne({
				'federation.mxcUri': mxcUri,
				'federation.isRemote': true,
			});

			if (existing) {
				logger.debug('Remote file reference already exists', {
					mxcUri,
					fileId: existing._id,
				});
				return existing._id;
			}

			const pseudoId = `matrix_remote_${crypto.randomBytes(16).toString('hex')}`;

			const fileRecord: IUploadWithFederation = {
				_id: pseudoId,
				name: metadata.name || 'unnamed',
				size: metadata.size || 0,
				type: metadata.type || 'application/octet-stream',
				rid: metadata.roomId,
				userId: metadata.userId,
				store: 'MatrixRemote:Uploads',
				complete: true,
				uploading: false,
				extension: this.getFileExtension(metadata.name),
				progress: 1,
				uploadedAt: new Date(),
				federation: {
					type: 'matrix',
					mxcUri,
					isRemote: true,
					serverName: parts.serverName,
					mediaId: parts.mediaId,
				},
				_updatedAt: new Date(),
			} as any;

			await Uploads.insertOne(fileRecord);

			return pseudoId;
		} catch (error) {
			logger.error('Error creating remote file reference:', error);
			throw error;
		}
	}

	static async getLocalFileBuffer(fileId: string): Promise<Buffer | null> {
		try {
			const fileRecord = (await Uploads.findOneById(fileId)) as IUploadWithFederation | null;
			if (!fileRecord || (fileRecord as any).federation?.isRemote) {
				return null;
			}

			return await Upload.getFileBuffer({ file: fileRecord });
		} catch (error) {
			logger.error('Error retrieving file buffer:', error);
			return null;
		}
	}

	static async isRemoteFile(fileId: string): Promise<boolean> {
		try {
			const file = (await Uploads.findOneById(fileId)) as IUploadWithFederation | null;
			return (file as any)?.federation?.isRemote === true;
		} catch (error) {
			logger.error('Error checking if file is remote:', error);
			return false;
		}
	}

	static async getRemoteFileInfo(fileId: string): Promise<I | null> {
		try {
			const file = (await Uploads.findOneById(fileId)) as IUploadWithFederation | null;
			if (!file || !(file as any)?.federation?.isRemote) {
				return null;
			}

			const fed = (file as any).federation;
			return {
				name: file.name || '',
				size: file.size || 0,
				type: file.type || '',
				mxcUri: fed.mxcUri || '',
				serverName: fed.serverName || '',
				mediaId: fed.mediaId || '',
			};
		} catch (error) {
			logger.error('Error getting remote file info:', error);
			return null;
		}
	}

	static async validateUserAccess(userId: string, fileId: string): Promise<boolean> {
		try {
			const file = await Uploads.findOneById(fileId);
			if (!file) {
				return false;
			}

			if (file.rid) {
				const subscription = await Subscriptions.findOneByRoomIdAndUserId(file.rid, userId);
				if (!subscription) {
					return false;
				}
			}

			return true;
		} catch (error) {
			logger.error('Error validating user access:', error);
			return false;
		}
	}

	static async isUploadEnabled(): Promise<boolean> {
		try {
			const fileUploadEnabled = await Settings.getValueById('FileUpload_Enabled');
			return Boolean(fileUploadEnabled);
		} catch (error) {
			logger.error('Error checking upload settings:', error);
			return false;
		}
	}

	private static getFileExtension(fileName: string): string {
		if (!fileName) return '';
		const lastDotIndex = fileName.lastIndexOf('.');
		if (lastDotIndex === -1) {
			return '';
		}
		return fileName.substring(lastDotIndex + 1).toLowerCase();
	}

	static async cleanupOrphanedReferences(): Promise<void> {
		try {
			const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

			const result = await Uploads.deleteMany({
				'federation.isRemote': true,
				'uploadedAt': { $lt: cutoffDate },
				'store': 'MatrixRemote:Uploads',
			});

			if (result.deletedCount > 0) {
				logger.debug('Cleaned up orphaned remote file references', {
					count: result.deletedCount,
				});
			}
		} catch (error) {
			logger.error('Error cleaning up orphaned references:', error);
		}
	}
}
