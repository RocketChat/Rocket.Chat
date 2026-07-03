import type { BehaviorWithContext } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

// Real licenses are well over this length; shorter input is still being typed.
export const MIN_LICENSE_LENGTH = 100;

export const isPlausibleLicense = (license: string): boolean => license.trim().length >= MIN_LICENSE_LENGTH;

// RestApiClient unwraps failures into their parsed body, so a rejection is the failure body, not a Response.
const isValidationFailure = (error: unknown): error is { reasons: BehaviorWithContext[] } =>
	typeof error === 'object' && error !== null && Array.isArray((error as { reasons?: unknown }).reasons);

export const useValidateLicense = (license: string) => {
	const validateLicense = useEndpoint('POST', '/v1/licenses.validate');
	const trimmedLicense = license.trim();

	return useQuery({
		queryKey: ['licenses.validate', trimmedLicense] as const,
		queryFn: async (): Promise<{ valid: boolean; reasons: BehaviorWithContext[] }> => {
			try {
				await validateLicense({ license: trimmedLicense });
				return { valid: true, reasons: [] };
			} catch (error) {
				if (isValidationFailure(error)) {
					return { valid: false, reasons: error.reasons };
				}
				throw error;
			}
		},
		enabled: isPlausibleLicense(trimmedLicense),
		staleTime: Infinity,
		gcTime: Infinity,
		retry: false,
	});
};
