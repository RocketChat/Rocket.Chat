import type { BannerPlatform, IBanner } from '@rocket.chat/core-typings';

import { ajv, ajvQuery } from './Ajv';

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
			description: 'The platform rendering the banner',
			example: 'web',
		},
	},
	required: ['platform'],
	additionalProperties: false,
};

export const isBannersProps = ajvQuery.compile<Banners>(BannersSchema);

const BannerIdParamsSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			description: 'The id of the banner',
			example: 'ByehQjC44FwMeiLbX',
		},
	},
	required: ['id'],
	additionalProperties: false,
};

export const isBannerIdParams = ajv.compile<{ id: string }>(BannerIdParamsSchema);

type BannersDismiss = {
	bannerId: string;
};

const BannersDismissSchema = {
	type: 'object',
	properties: {
		bannerId: {
			type: 'string',
			minLength: 1,
			description: 'The id of the banner to dismiss',
			example: 'ByehQjC44FwMeiLbX',
		},
	},
	required: ['bannerId'],
	additionalProperties: false,
};

export const isBannersDismissProps = ajv.compile<BannersDismiss>(BannersDismissSchema);

export type BannersEndpoints = {
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
