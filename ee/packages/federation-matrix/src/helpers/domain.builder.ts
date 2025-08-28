import { Settings } from '@rocket.chat/core-services';

const PROTOCOL_REGEX = /^https?:\/\//;
const PATH_REGEX = /\/.*$/;
const DEFAULT_HTTP_PORTS = [80, 443];

/**
 * Extracts hostname from a URL string using multiple strategies
 * @param url - URL string that may or may not have a protocol
 * @returns hostname without protocol, path, or port
 */
function extractHostname(url: string): string {
	// Strategy 1: Try native URL parsing with the string as-is
	try {
		const parsed = new URL(url);
		if (parsed.hostname) {
			return parsed.hostname;
		}
	} catch {
		// URL parsing failed, try next strategy
	}

	// Strategy 2: Add http:// if no protocol and try again
	if (!PROTOCOL_REGEX.test(url)) {
		try {
			const parsed = new URL(`http://${url}`);
			if (parsed.hostname) {
				return parsed.hostname;
			}
		} catch {
			// Still failed, fall through to manual parsing
		}
	}

	// Strategy 3: Manual extraction as last resort
	return url.replace(PROTOCOL_REGEX, '').replace(PATH_REGEX, '').split(':')[0];
}

/**
 * Builds the Matrix federation domain from site settings
 * @returns Matrix domain in format "hostname" or "hostname:port"
 */
export const getMatrixLocalDomain = async (): Promise<string> => {
	// Fetch settings in parallel for better performance
	const [port, siteUrl] = await Promise.all([Settings.get<number>('Federation_Service_Matrix_Port'), Settings.get<string>('Site_Url')]);

	if (!port || !siteUrl) {
		throw new Error('Matrix domain or port not found');
	}

	const hostname = extractHostname(siteUrl);

	// Only append non-standard ports
	return DEFAULT_HTTP_PORTS.includes(port) ? hostname : `${hostname}:${port}`;
};
