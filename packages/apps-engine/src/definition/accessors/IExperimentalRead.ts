/**
 * @description
 * Experimental bridge for experimental features.
 * Methods in this class are not guaranteed to be stable between updates as the
 * team evaluates the proper signature, underlying implementation and performance
 * impact of candidates for future APIs
 */
export interface IExperimentalRead {
	/**
	 * Fetches the IDs of the rooms that the user is a member of.
	 *
	 * @returns an array of room ids or undefined if the app doesn't have the proper permission
	 * @experimental
	 */
	getUserRoomIds(userId: string): Promise<string[] | undefined>;
}
