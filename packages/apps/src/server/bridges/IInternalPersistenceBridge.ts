export interface IInternalPersistenceBridge {
	/**
	 * Purges the App's persistent storage data from the persistent storage.
	 * For apps engine's internal use
	 *
	 * @argument appId the id of the app's data to remove
	 */
	purge(appId: string): Promise<void>;
}
