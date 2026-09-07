/**
 * Returns the migrated JSON string, or `null` when there is nothing to do.
 *
 * Exported so the transform can be tested without a database: the interesting cases are all about
 * what it declines to touch.
 */
export const bumpBannerConfigToV2 = (raw: unknown): string | null => {
	// Unset, or never configured: nothing to migrate. The setting's default is an empty string.
	if (typeof raw !== 'string' || raw.trim() === '') {
		return null;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		// A document an administrator is midway through editing must not be destroyed by a
		// migration. Left exactly as found; re-saving it will surface the validation error.
		return null;
	}

	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		return null;
	}

	const config = parsed as Record<string, unknown>;

	// Only a v1 document needs the bump. Anything already on 2 — or on a version this migration
	// does not know — is left alone.
	if (config.version !== 1) {
		return null;
	}

	return JSON.stringify({ ...config, version: 2 }, null, 2);
};
