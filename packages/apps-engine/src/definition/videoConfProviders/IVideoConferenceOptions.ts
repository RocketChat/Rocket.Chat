/**
 * How the user asked to join, passed to `IVideoConfProvider.customizeUrl`.
 *
 * Rocket.Chat only offers what the provider declared in
 * `IVideoConfProvider.capabilities`, so a provider that declared neither
 * receives nothing here.
 */
export interface IVideoConferenceOptions {
	/** Whether the user's microphone should start on. */
	mic?: boolean;
	/** Whether the user's camera should start on. */
	cam?: boolean;
}
