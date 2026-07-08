import type { IMediaCall } from '../mediaCalls/IMediaCall';

/**
 * This accessor provides methods for accessing
 * media calls in a read-only-fashion.
 */
export interface IMediaCallRead {
	/**
	 * Gets a media call by an id.
	 *
	 * @param id the id of the media call
	 * @returns the media call
	 */
	getById(id: string): Promise<IMediaCall | undefined>;
}
