export interface IRocketChatAssetConstraint {
	type: string;
	extensions: string[];
	width?: number;
	height?: number;
}

export interface IRocketChatAssetWizard {
	step: number;
	order: number;
}

export interface IRocketChatAssetCache {
	path: string;
	cacheable: boolean;
	where: string;
	type: string;
	content?: Buffer;
	extension?: string;
	url: string;
	size?: number;
	uploadDate?: Date;
	contentType?: string;
	hash: string;
	sourceMapUrl?: string;
}

export interface IRocketChatAsset {
	label: string;
	constraints: IRocketChatAssetConstraint;
	defaultUrl?: string;
	url?: string;
	wizard?: IRocketChatAssetWizard;
	cache?: IRocketChatAssetCache;
}

export interface IRocketChatAssets {
	logo: IRocketChatAsset;
	background: IRocketChatAsset;
	favicon_ico: IRocketChatAsset;
	favicon: IRocketChatAsset;
	favicon_16: IRocketChatAsset;
	favicon_32: IRocketChatAsset;
	favicon_192: IRocketChatAsset;
	favicon_512: IRocketChatAsset;
	touchicon_180: IRocketChatAsset;
	touchicon_180_pre: IRocketChatAsset;
	tile_70: IRocketChatAsset;
	tile_144: IRocketChatAsset;
	tile_150: IRocketChatAsset;
	tile_310_square: IRocketChatAsset;
	tile_310_wide: IRocketChatAsset;
	safari_pinned: IRocketChatAsset;
}
