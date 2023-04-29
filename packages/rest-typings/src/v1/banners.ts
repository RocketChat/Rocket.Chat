import type { BannerPlatform, IBanner } from '@rocket.chat/core-typings';

import { ajv } from '../helpers/schemas';

type BannersGetNew = {
	platform: BannerPlatform;
	bid: IBanner['_id'];
};

const BannersGetNewSchema = {
	type: 'object',
	properties: {
		platform: {
			type: 'string',
			enum: ['1', '2'],
		},
		bid: {
			type: 'string',
		},
	},
	required: ['platform', 'bid'],
	additionalProperties: false,
};

export const isBannersGetNewProps = ajv.compile<BannersGetNew>(BannersGetNewSchema);

type BannersId = {
	platform: BannerPlatform;
};

const BannersIdSchema = {
	type: 'object',
	properties: {
		platform: {
			type: 'string',
		},
	},
	required: ['platform'],
	additionalProperties: false,
};

export const isBannersIdProps = ajv.compile<BannersId>(BannersIdSchema);

type Banners = {
	platform: BannerPlatform;
};

const BannersSchema = {
	type: 'object',
	properties: {
		platform: {
			type: 'string',
		},
	},
	required: ['platform'],
	additionalProperties: false,
};

export const isBannersProps = ajv.compile<Banners>(BannersSchema);

type BannersDismiss = {
	bannerId: string;
};

const BannersDismissSchema = {
	type: 'object',
	properties: {
		bannerId: {
			type: 'string',
		},
	},
	required: ['bannerId'],
	additionalProperties: false,
};

export const isBannersDismissProps = ajv.compile<BannersDismiss>(BannersDismissSchema);

export type BannersEndpoints = {
	/* @deprecated */
	'/v1/banners.getNew': {
		GET: (params: BannersGetNew) => {
			banners: IBanner[];
		};
	};

	'/v1/banners/:id': {
		GET: (params: BannersId) => {
			banners: IBanner[];
		};
	};

	'/v1/banners': {
		GET: (params: Banners) => {
			banners: IBanner[];
		};
	};

	'/v1/banners.dismiss': {
		POST: (params: BannersDismiss) => void;
	};
};
