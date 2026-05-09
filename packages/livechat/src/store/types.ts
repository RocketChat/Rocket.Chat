import type { ComponentChildren } from 'preact';

/**
 * Alert notification displayed in the UI
 */
export interface Alert {
	id: string;
	children: ComponentChildren;
	success?: boolean;
	warning?: boolean;
	error?: boolean;
	timeout?: number;
}

/**
 * Livechat configuration messages (i18n strings)
 */
export interface LivechatConfigMessages {
	conversationFinishedMessage?: string;
	// Allow additional message keys from server configuration
	[key: string]: string | undefined;
}

/**
 * Livechat resources (i18n and other resource data)
 * Restricted to primitive types for better type safety
 */
export type LivechatResource = Record<string, string | number | boolean>;

/**
 * File upload configuration settings
 */
export interface FileUploadConfig {
	enabled?: boolean;
	maxFileSize?: number;
	// Can be comma-separated MIME types or array depending on server response
	acceptedMediaTypes?: string | string[];
}

/**
 * Queue information for waiting visitors
 */
export interface QueueInfo {
	spot: number;
	estimatedWaitTimeSeconds: number;
	message?: string;
}

/**
 * Incoming call alert information
 */
export interface IncomingCallAlert {
	callId: string;
	callerName?: string;
	callerUsername?: string;
}
