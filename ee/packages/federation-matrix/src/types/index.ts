// Re-export existing types
export * from './ICallbacks';

// File-related event interfaces matching homeserver signatures
export interface MatrixMediaUploadEvent {
	userId: string;
	roomId: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	uploadToken: string;
}

export interface MatrixMediaDownloadEvent {
	userId: string;
	mediaId: string;
	serverName: string;
}

export interface MatrixMediaUploadCompleteEvent {
	uploadToken: string;
	rcFileId: string;
	mxcUri: string;
	success: boolean;
	error?: string;
}

// File metadata interfaces
export interface FileMetadata {
	mxcUri: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	uploadedAt: Date;
	category?: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
	extension?: string;
	formattedSize?: string;
}

export interface MXCUriParts {
	serverName: string;
	mediaId: string;
}

export interface FileValidationResult {
	valid: boolean;
	error?: string;
}

export interface FileUploadRequest {
	userId: string;
	roomId: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	uploadToken: string;
}

// File operation permissions
export interface FilePermissionContext {
	userId: string;
	roomId: string;
	fileId?: string;
	operation: 'upload' | 'download';
}

// File bridge service configuration
export interface FileBridgeConfig {
	maxFileSize?: number;
	allowedMimeTypes?: string[];
	enableThumbnailGeneration?: boolean;
	thumbnailSizes?: Array<{ width: number; height: number }>;
	defaultMimeType?: string;
	uploadTimeout?: number; // in milliseconds
}

// File processing status
export interface FileProcessingStatus {
	fileId: string;
	status: 'pending' | 'processing' | 'completed' | 'failed';
	progress?: number; // 0-100
	error?: string;
	processingStartedAt?: Date;
	processingCompletedAt?: Date;
}

// File storage information
export interface FileStorageInfo {
	fileId: string;
	storageProvider: string; // 'GridFS' | 'FileSystem' | 'AmazonS3' | etc.
	storagePath: string;
	storageSize: number;
	checksumMD5?: string;
	checksumSHA256?: string;
	createdAt: Date;
	lastAccessedAt?: Date;
	accessCount?: number;
}

// Matrix file message content types
export interface MatrixFileMessageContent {
	body: string; // filename
	filename?: string;
	info?: {
		mimetype?: string;
		size?: number;
		thumbnail_info?: {
			h?: number;
			w?: number;
			mimetype?: string;
			size?: number;
		};
		thumbnail_url?: string; // mxc:// URI
		h?: number; // height for images/videos
		w?: number; // width for images/videos
		duration?: number; // duration in milliseconds for audio/video
	};
	msgtype: 'm.file' | 'm.image' | 'm.video' | 'm.audio';
	url: string; // mxc:// URI
}

// Thumbnail generation request
export interface ThumbnailRequest {
	fileId: string;
	width: number;
	height: number;
	method?: 'crop' | 'scale';
	animated?: boolean;
}

export interface ThumbnailResponse {
	thumbnailId: string;
	mxcUri: string;
	width: number;
	height: number;
	size: number;
	mimeType: string;
}

// File download request parameters
export interface FileDownloadParams {
	serverName: string;
	mediaId: string;
	fileName?: string;
	allowRemote?: boolean;
	timeoutMs?: number;
	allowRedirect?: boolean;
}

// File upload progress tracking
export interface FileUploadProgress {
	uploadToken: string;
	fileId: string;
	bytesUploaded: number;
	totalBytes: number;
	progress: number; // 0-100
	speed?: number; // bytes per second
	estimatedTimeRemaining?: number; // in seconds
	status: 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

// Error types for file operations
export interface FileOperationError {
	code: string;
	message: string;
	details?: Record<string, any>;
	fileId?: string;
	operation?: string;
}

// Common file operation error codes
export const FileErrorCodes = {
	FILE_TOO_LARGE: 'M_TOO_LARGE',
	INVALID_MIME_TYPE: 'M_INVALID_MIME_TYPE',
	FILE_NOT_FOUND: 'M_NOT_FOUND',
	PERMISSION_DENIED: 'M_FORBIDDEN',
	UPLOAD_TIMEOUT: 'M_TIMEOUT',
	STORAGE_FULL: 'M_LIMIT_EXCEEDED',
	PROCESSING_FAILED: 'M_UNKNOWN',
	INVALID_TOKEN: 'M_INVALID_TOKEN',
	DUPLICATE_FILE: 'M_DUPLICATE',
} as const;

export type FileErrorCode = typeof FileErrorCodes[keyof typeof FileErrorCodes];

// Federation-specific field for Upload records
export interface MatrixFederation {
	type: 'matrix';
	mxcUri?: string;  // mxc://server/mediaId - set when upload completes
	uploadToken?: string; // temporary token for upload tracking
	origin?: string; // for remote files - the originating server
}