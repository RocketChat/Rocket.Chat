import type { IAsset } from './IAsset';

export interface IAssetProvider {
    getAssets(): Array<IAsset>;
}
