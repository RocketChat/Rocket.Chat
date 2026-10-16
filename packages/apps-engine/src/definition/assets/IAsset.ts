/** A file an App ships and the workspace serves on its behalf. */
export interface IAsset {
	/** The asset's name. */
	name: string;
	/** Where the file sits inside the App's package. */
	path: string;
	/** The file's MIME type. */
	type: string;
	/** Whether anyone may fetch the asset, or only a logged-in user. */
	public: boolean;
}
