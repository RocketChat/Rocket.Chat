import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IBlock } from '../uikit';
import type { IVideoConferenceOptions } from './IVideoConferenceOptions';
import type { VideoConfData, VideoConfDataExtended } from './VideoConfData';
import type { VideoConference } from '../videoConferences/IVideoConference';
import type { IVideoConferenceUser } from '../videoConferences/IVideoConferenceUser';

/**
 * A video conference service an App makes available to the workspace.
 *
 * Register one from `IVideoConfProvidersExtend.provideVideoConfProvider`. The
 * two required methods turn a conference into a URL; everything else lets the
 * provider follow along and react.
 */
export interface IVideoConfProvider {
	/** The provider's name, which administrators pick it by. */
	name: string;

	/**
	 * What the provider lets Rocket.Chat control.
	 *
	 * Rocket.Chat hides the corresponding UI for anything left out, so declare
	 * only what `customizeUrl` and `generateUrl` actually honour.
	 */
	capabilities?: {
		/** Rocket.Chat can decide whether the user's microphone starts muted. */
		mic?: boolean;
		/** Rocket.Chat can decide whether the user's camera starts on. */
		cam?: boolean;
		/** Rocket.Chat can set a custom title on a conference. */
		title?: boolean;
		/** The provider supports Rocket.Chat's Persistent Chat on its conferences. */
		persistentChat?: boolean;
	};

	/**
	 * Reports whether the provider can be used yet.
	 *
	 * Return false while a setting the provider needs is still empty:
	 * Rocket.Chat then keeps it out of the list administrators choose from.
	 */
	isFullyConfigured?(read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<boolean>;

	/** Called after a conference opens on this provider. */
	onNewVideoConference?(call: VideoConference, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void>;

	/** Called after Rocket.Chat changes a conference of this provider. */
	onVideoConferenceChanged?(call: VideoConference, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void>;

	/** Called after a user joins a conference of this provider. */
	onUserJoin?(
		call: VideoConference,
		user: IVideoConferenceUser | undefined,
		read: IRead,
		modify: IModify,
		http: IHttp,
		persis: IPersistence,
	): Promise<void>;

	/**
	 * Called when a user opens a conference's info panel.
	 *
	 * Return the UIKit blocks to render in the modal.
	 */
	getVideoConferenceInfo?(
		call: VideoConference,
		user: IVideoConferenceUser | undefined,
		read: IRead,
		modify: IModify,
		http: IHttp,
		persis: IPersistence,
	): Promise<Array<IBlock>>;

	/**
	 * Creates the conference on the external service and returns its URL.
	 *
	 * Called once per conference. Everyone who joins starts from this URL.
	 */
	generateUrl(call: VideoConfData, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<string>;
	/**
	 * Turns the conference's URL into the one this user should open.
	 *
	 * Called every time somebody joins, so this is where a per-user token or the
	 * requested microphone and camera state belongs.
	 */
	customizeUrl(
		call: VideoConfDataExtended,
		user: IVideoConferenceUser | undefined,
		options: IVideoConferenceOptions | undefined,
		read: IRead,
		modify: IModify,
		http: IHttp,
		persis: IPersistence,
	): Promise<string>;
}
