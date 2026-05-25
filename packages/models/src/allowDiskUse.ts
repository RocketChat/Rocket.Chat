/**
 * Returns an object with the `allowDiskUse` option for MongoDB aggregation/find operations.
 *
 * Amazon DocumentDB does not support `allowDiskUse` for `find` commands and uses
 * sort merge by default for aggregations when `allowDiskUse` is not specified.
 * When the `DOCUMENTDB` environment variable is set to 'true', this function
 * returns an empty object so the option is omitted from queries.
 *
 * @see https://docs.aws.amazon.com/documentdb/latest/developerguide/how-it-works.html
 */
export function getAllowDiskUse(): { allowDiskUse: true } | Record<string, never> {
	if (process.env.DOCUMENTDB === 'true') {
		return {};
	}

	return { allowDiskUse: true };
}
