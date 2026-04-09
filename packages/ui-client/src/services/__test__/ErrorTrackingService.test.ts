import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorTrackingService } from '../ErrorTrackingService';
import type { ErrorMetadata } from '../ErrorTrackingService';

describe('ErrorTrackingService', () => {
	let consoleGroupSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should log errors with correct metadata to the console', () => {
		const testError = new Error('Test Crash');
		const metadata: ErrorMetadata = {
			scope: 'feature',
			severity: 'high',
			recoverable: true,
			componentPath: 'WorkspacePage',
		};

		errorTrackingService.reportError(testError, metadata);

		expect(consoleGroupSpy).toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalledWith('Message:', 'Test Crash');
		expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Stack Trace:'), expect.any(String));
	});

	it('should handle component scope with medium severity', () => {
		const error = new Error('Component failure');
		const metadata: ErrorMetadata = {
			scope: 'component',
			severity: 'medium',
			recoverable: true,
			componentPath: 'VideoConferenceBlock',
		};

		errorTrackingService.reportError(error, metadata);

		expect(consoleGroupSpy).toHaveBeenCalledWith(
			expect.stringContaining('[COMPONENT]'),
			expect.any(String)
		);
	});

	it('should handle global scope critical errors', () => {
		const criticalError = new Error('Global Failure');
		const metadata: ErrorMetadata = {
			scope: 'global',
			severity: 'critical',
			recoverable: false,
		};

		errorTrackingService.reportError(criticalError, metadata);

		expect(consoleGroupSpy).toHaveBeenCalledWith(
			expect.stringContaining('[GLOBAL]'),
			expect.any(String)
		);
	});
});
