import type { LicenseValidationResult, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

// Every real license (V2 base64 blob or V3 `RCV3_` JWT) is well over this length, so
// anything shorter is necessarily incomplete — gate validation on it to avoid spending
// requests on partial/in-progress input.
export const MIN_LICENSE_LENGTH = 100;

export const isPlausibleLicense = (license: string): boolean => license.trim().length >= MIN_LICENSE_LENGTH;

/**
 * Validates a raw license string against the current workspace without applying it,
 * returning the decoded license, the modules it would grant and any validation errors,
 * so the outcome can be previewed before committing.
 *
 * The caller is responsible for debouncing the input, so the query key tracks the
 * provided license directly and the validating state stays in sync with the request.
 * Input too short to be a complete license is never sent to the server.
 */
export const useValidateLicense = (license: string) => {
	const validateLicense = useEndpoint('POST', '/v1/licenses.validate');
	const trimmedLicense = license.trim();

	return useQuery({
		queryKey: ['licenses.validate', trimmedLicense] as const,
		queryFn: async (): Promise<Serialized<LicenseValidationResult>> => {
			const { validation } = await validateLicense({ license: trimmedLicense });
			return validation;
		},
		enabled: isPlausibleLicense(trimmedLicense),
		// A given license string always validates to the same result, so cache it.
		staleTime: Infinity,
		gcTime: Infinity,
		retry: false,
	});
};
