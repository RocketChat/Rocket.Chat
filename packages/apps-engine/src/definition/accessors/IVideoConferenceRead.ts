import type { VideoConference } from '../videoConferences/IVideoConference';

/**
 * This accessor provides methods for accessing
 * video conferences in a read-only-fashion.
 */
export interface IVideoConferenceRead {
    /**
     * Gets a video conference by an id.
     *
     * @param id the id of the video conference
     * @returns the video conference
     */
    getById(id: string): Promise<VideoConference | undefined>;
}
