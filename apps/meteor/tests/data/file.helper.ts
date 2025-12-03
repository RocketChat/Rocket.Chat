import * as fs from 'fs';

import type { IMessage } from '@rocket.chat/core-typings';

import { api } from './api-data';
import type { IRequestConfig } from './users.helper';

/**
 * Uploads a file to Rocket.Chat using the two-step process (rooms.media then rooms.mediaConfirm).
 *
 * @param roomId - The room ID where the file will be uploaded
 * @param filePath - Path to the file to upload
 * @param description - Description for the file
 * @param config - Request configuration with credentials and request instance
 * @param message - Optional message text to include with the file
 * @returns Promise resolving to the message response
 */
export async function uploadFileToRC(
	roomId: string,
	filePath: string,
	description: string,
	config: IRequestConfig,
	message = '',
): Promise<{ message: IMessage }> {
	const requestInstance = config.request;
	const credentialsInstance = config.credentials;

	// Step 1: Upload file to rooms.media/:rid
	const mediaResponse = await requestInstance
		.post(api(`rooms.media/${roomId}`))
		.set(credentialsInstance)
		.attach('file', filePath)
		.expect('Content-Type', 'application/json')
		.expect(200);

	if (!mediaResponse.body.success || !mediaResponse.body.file?._id) {
		throw new Error(`File upload failed: ${JSON.stringify(mediaResponse.body)}`);
	}

	const fileId = mediaResponse.body.file._id;

	// Step 2: Confirm and send message with rooms.mediaConfirm/:rid/:fileId
	const confirmResponse = await requestInstance
		.post(api(`rooms.mediaConfirm/${roomId}/${fileId}`))
		.set(credentialsInstance)
		.send({
			msg: message,
			description,
		})
		.expect('Content-Type', 'application/json')
		.expect(200);

	if (!confirmResponse.body.success || !confirmResponse.body.message) {
		throw new Error(`File confirmation failed: ${JSON.stringify(confirmResponse.body)}`);
	}

	return confirmResponse.body;
}

/**
 * Gets the list of files for a room.
 *
 * @param roomId - The room ID
 * @param config - Request configuration
 * @param options - Optional query parameters (name for filtering, count, offset)
 * @returns Promise resolving to the files list response
 */
export async function getFilesList(
	roomId: string,
	config: IRequestConfig,
	options: { name?: string; count?: number; offset?: number } = {},
): Promise<{
	files: Array<{
		_id: string;
		name: string;
		size: number;
		type: string;
		rid: string;
		userId: string;
		path?: string;
		url?: string;
		uploadedAt?: string;
		federation?: {
			mrid?: string;
			mxcUri?: string;
			serverName?: string;
			mediaId?: string;
		};
	}>;
	count: number;
	offset: number;
	total: number;
	success: boolean;
}> {
	const requestInstance = config.request;
	const credentialsInstance = config.credentials;

	const queryParams: Record<string, string> = {
		roomId,
		count: String(options.count || 10),
		offset: String(options.offset || 0),
		sort: JSON.stringify({ uploadedAt: -1 }),
	};

	if (options.name) {
		queryParams.name = options.name;
	}

	const response = await requestInstance
		.get(api('groups.files'))
		.set(credentialsInstance)
		.query(queryParams)
		.expect('Content-Type', 'application/json')
		.expect(200);

	if (!response.body.success) {
		throw new Error(`Failed to get files list: ${JSON.stringify(response.body)}`);
	}

	return response.body;
}

/**
 * Downloads a file and verifies it matches the original file using binary comparison.
 *
 * @param fileUrl - The URL to download the file from (relative path like /file-upload/...)
 * @param originalFilePath - Path to the original file to compare against
 * @param config - Request configuration
 * @returns Promise resolving to true if files match byte-by-byte
 */
export async function downloadFileAndVerifyBinary(fileUrl: string, originalFilePath: string, config: IRequestConfig): Promise<boolean> {
	const requestInstance = config.request;
	const credentialsInstance = config.credentials;

	const response = await requestInstance.get(fileUrl).set(credentialsInstance).expect(200);

	// Handle different response types:
	// - For text/plain, supertest parses as JSON (resulting in {}), so use response.text
	// - For binary files, response.body might be a Buffer
	// - For other text types, response.text contains the content
	let downloadedBuffer: Buffer;
	if (Buffer.isBuffer(response.body)) {
		// Binary file - response.body is already a Buffer
		downloadedBuffer = response.body;
	} else if (response.text !== undefined) {
		// Text response (including text/plain) - use response.text to avoid JSON parsing
		// Convert to Buffer using binary encoding to preserve exact bytes
		downloadedBuffer = Buffer.from(response.text, 'binary');
	} else if (typeof response.body === 'string') {
		// Fallback: if body is a string, convert to buffer
		downloadedBuffer = Buffer.from(response.body, 'binary');
	} else {
		// If body is an object (like {} from JSON parsing), this is an error
		throw new Error(
			`Failed to get file content. Response body type: ${typeof response.body}. ` +
				`This usually means supertest parsed a text/plain response as JSON. ` +
				`Response text available: ${response.text !== undefined ? 'yes' : 'no'}`,
		);
	}

	// Read the original file
	const originalBuffer = fs.readFileSync(originalFilePath);

	// Compare buffers byte-by-byte
	if (downloadedBuffer.length !== originalBuffer.length) {
		return false;
	}

	return downloadedBuffer.equals(originalBuffer);
}
