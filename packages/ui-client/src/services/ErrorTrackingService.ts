export interface ErrorMetadata {
	componentPath?: string;
	severity: 'critical' | 'high' | 'medium' | 'low';
	recoverable: boolean;
	scope: 'global' | 'feature' | 'component';
}

class ErrorTrackingService {
	public reportError(error: Error, metadata: ErrorMetadata): void {
		// Log to console with distinct styling for developer visibility
		console.group(
			`%c Rocket.Chat UI Error [${metadata.scope.toUpperCase()}]`,
			'color: white; background: #E41F12; padding: 4px; font-weight: bold; border-radius: 2px;',
		);
		console.error('Message:', error.message);
		console.error('Stack Trace:', error.stack);
		console.info('Metadata:', metadata);
		console.groupEnd();

		// Future: Integration with Sentry or internal logging API
		// Sentry.captureException(error, { extra: metadata });
	}
}

export const errorTrackingService = new ErrorTrackingService();
