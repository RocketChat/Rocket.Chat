import type { BannerPlatform, IBanner } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

type BannersGetNew = {
	platform: BannerPlatform;
	bid: IBanner['_id'];
};

const BannersGetNewSchema = {
	type: 'object',
	properties: {
		platform: {
			type: 'string',
			enum: ['web', 'mobile'],
		},
		bid: {
			type: 'string',
		},
	},
	required: ['platform'],
	additionalProperties: false,
};

export const isBannersGetNewProps = ajv.compile<BannersGetNew>(BannersGetNewSchema);

type BannersId = {
	platform: BannerPlatform;
};

type Banners = {
	platform: BannerPlatform;
};

const BannersSchema = {
	type: 'object',
	properties: {
		platform: {
			type: 'string',
			enum: ['web', 'mobile'],
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
			minLength: 1,
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
