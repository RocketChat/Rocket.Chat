import type { IAsset } from './IAsset';

/** Declares the files an App ships alongside its code. */
export interface IAssetProvider {
	/** Lists the assets the workspace should serve for this App. */
	getAssets(): Array<IAsset>;
}
