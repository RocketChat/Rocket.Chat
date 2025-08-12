import { Logger } from '@rocket.chat/logger';
import { Uploads, Subscriptions, Settings } from '@rocket.chat/models';
import { Upload } from '@rocket.chat/core-services';
import crypto from 'crypto';
import type { IUploadWithFederation } from '../types/IUploadWithFederation';

const logger = new Logger('federation-matrix:media-service');

export interface RemoteFileReference {
	name: string;
	size: number;
	type: string;
	mxcUri: string;
	serverName: string;
	mediaId: string;
}

/**
 * MatrixMediaService - Handles Matrix media federation for Rocket.Chat
 *
 * This service manages:
 * - Making local RC files accessible to Matrix network
 * - Creating references to remote Matrix files for display in RC
 * - Proxying remote file requests
 */
export class MatrixMediaService {
	/**
	 * Generate a Matrix Content URI (mxc://) for a local RC file
	 */
	static generateMXCUri(fileId: string, serverName: string): string {
		// Use file ID as media ID for easy reverse lookup
		return `mxc://${serverName}/${fileId}`;
	}

	/**
	 * Parse MXC URI to extract server name and media ID
	 */
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

	/**
	 * Prepare a local RC file for Matrix federation
	 * Called when sending a message with attachment to Matrix
	 */
	static async prepareLocalFileForMatrix(fileId: string, serverName: string): Promise<string> {
		try {
			const file = await Uploads.findOneById(fileId);
			if (!file) {
				throw new Error(`File ${fileId} not found`);
			}

			// Check if already has MXC URI
			if (file.federation?.mxcUri) {
				logger.debug('File already has MXC URI', { fileId, mxcUri: file.federation.mxcUri });
				return file.federation.mxcUri;
			}

			// Generate MXC URI for this file
			const mxcUri = this.generateMXCUri(fileId, serverName);

			// Update file with federation metadata
			await Uploads.updateOne(
				{ _id: fileId },
				{
					$set: {
						federation: {
							type: 'matrix',
							mxcUri,
							isRemote: false,
							serverName,
							mediaId: fileId,
						} as any,
					},
				},
			);

			logger.info('Prepared local file for Matrix', {
				fileId,
				mxcUri,
				fileName: file.name,
			});

			return mxcUri;
		} catch (error) {
			logger.error('Error preparing file for Matrix:', error);
			throw error;
		}
	}

	/**
	 * Get a local file by MXC URI for serving to Matrix nodes
	 */
	static async getLocalFileForMatrixNode(mxcUri: string): Promise<IUploadWithFederation | null> {
		try {
			const parts = this.parseMXCUri(mxcUri);
			if (!parts) {
				return null;
			}

			// First try to find by MXC URI
			let file = (await Uploads.findOne({
				'federation.mxcUri': mxcUri,
				'federation.isRemote': false,
			})) as IUploadWithFederation | null;

			// Fallback to direct ID lookup (mediaId is fileId for local files)
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

	/**
	 * Create a reference to a remote Matrix file in RC
	 * This doesn't download the file, just creates a record for UI display
	 */
	static async createRemoteFileReference(
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

			// Check if we already have a reference to this remote file
			const existing = await Uploads.findOne({
				'federation.mxcUri': mxcUri,
				'federation.isRemote': true,
			});

			if (existing) {
				logger.debug('Remote file reference already exists', { mxcUri, fileId: existing._id });
				return existing._id;
			}

			// Create a pseudo-ID for the remote file
			const pseudoId = `matrix_remote_${crypto.randomBytes(16).toString('hex')}`;

			// Create a reference record (no actual file storage)
			const fileRecord: IUploadWithFederation = {
				_id: pseudoId,
				name: metadata.name || 'unnamed',
				size: metadata.size || 0,
				type: metadata.type || 'application/octet-stream',
				rid: metadata.roomId,
				userId: metadata.userId,
				store: 'MatrixRemote:Uploads', // Special store type for remote files
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

			logger.info('Created remote file reference', {
				fileId: pseudoId,
				mxcUri,
				fileName: metadata.name,
			});

			return pseudoId;
		} catch (error) {
			logger.error('Error creating remote file reference:', error);
			throw error;
		}
	}

	/**
	 * Get file buffer for local files (used when serving to Matrix nodes)
	 */
	static async getLocalFileBuffer(fileId: string): Promise<Buffer | null> {
		try {
			const fileRecord = (await Uploads.findOneById(fileId)) as IUploadWithFederation | null;
			if (!fileRecord || (fileRecord as any).federation?.isRemote) {
				return null;
			}

			// Use Rocket.Chat's Upload service to get file buffer
			const buffer = await Upload.getFileBuffer({ file: fileRecord });

			logger.info('Retrieved local file buffer', {
				fileId,
				fileName: fileRecord.name,
				size: buffer?.length,
			});

			return buffer;
		} catch (error) {
			logger.error('Error retrieving file buffer:', error);
			return null;
		}
	}

	/**
	 * Check if a file is a remote Matrix file
	 */
	static async isRemoteFile(fileId: string): Promise<boolean> {
		try {
			const file = (await Uploads.findOneById(fileId)) as IUploadWithFederation | null;
			return (file as any)?.federation?.isRemote === true;
		} catch (error) {
			logger.error('Error checking if file is remote:', error);
			return false;
		}
	}

	/**
	 * Get remote file metadata for proxying
	 */
	static async getRemoteFileInfo(fileId: string): Promise<RemoteFileReference | null> {
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

	/**
	 * Validate if user has access to file's room
	 */
	static async validateUserAccess(userId: string, fileId: string): Promise<boolean> {
		try {
			const file = await Uploads.findOneById(fileId);
			if (!file) {
				return false;
			}

			// If file has a room ID, check access
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

	/**
	 * Check if file uploads are enabled globally
	 */
	static async isUploadEnabled(): Promise<boolean> {
		try {
			const fileUploadEnabled = await Settings.getValueById('FileUpload_Enabled');
			return Boolean(fileUploadEnabled);
		} catch (error) {
			logger.error('Error checking upload settings:', error);
			return false;
		}
	}

	/**
	 * Get file extension from filename
	 */
	private static getFileExtension(fileName: string): string {
		if (!fileName) return '';
		const lastDotIndex = fileName.lastIndexOf('.');
		if (lastDotIndex === -1) {
			return '';
		}
		return fileName.substring(lastDotIndex + 1).toLowerCase();
	}

	/**
	 * Clean up orphaned remote file references
	 */
	static async cleanupOrphanedReferences(): Promise<void> {
		try {
			// Remove remote file references older than 30 days with no associated messages
			const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

			const result = await Uploads.deleteMany({
				'federation.isRemote': true,
				'uploadedAt': { $lt: cutoffDate },
				'store': 'MatrixRemote:Uploads',
			});

			if (result.deletedCount > 0) {
				logger.info('Cleaned up orphaned remote file references', { count: result.deletedCount });
			}
		} catch (error) {
			logger.error('Error cleaning up orphaned references:', error);
		}
	}
}
