import type { ISetting, ISettingColor, LoginServiceConfiguration } from '@rocket.chat/core-typings';

import { ajv, ajvQuery } from './Ajv';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

type SettingsUpdateProps = SettingsUpdatePropDefault | SettingsUpdatePropsActions | SettingsUpdatePropsColor;

type SettingsUpdatePropsActions = {
	execute: boolean;
};

export const isSettingsUpdatePropsActions = (props: Partial<SettingsUpdateProps>): props is SettingsUpdatePropsActions =>
	'execute' in props;

type SettingsUpdatePropsColor = {
	editor: ISettingColor['editor'];
	value: ISetting['value'];
};

export const isSettingsUpdatePropsColor = (props: Partial<SettingsUpdateProps>): props is SettingsUpdatePropsColor =>
	'editor' in props && 'value' in props;

type SettingsUpdatePropDefault = {
	value: ISetting['value'];
};

export const isSettingsUpdatePropDefault = (props: Partial<SettingsUpdateProps>): props is SettingsUpdatePropDefault => 'value' in props;

type SettingsPublicWithPaginationProps = PaginatedRequest<{ _id?: string; query?: string }>;

const SettingsPublicWithPaginationSchema = {
	type: 'object',
	properties: {
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
		_id: {
			type: 'string',
		},
		query: {
			type: 'string',
		},
	},
	required: [],
	additionalProperties: false,
};

export const isSettingsPublicWithPaginationProps = ajvQuery.compile<SettingsPublicWithPaginationProps>(SettingsPublicWithPaginationSchema);

type SettingsGetParams = PaginatedRequest<{ includeDefaults?: boolean; query?: string }>;

const SettingsGetSchema = {
	type: 'object',
	properties: {
		includeDefaults: {
			type: 'boolean',
		},
		count: {
			type: 'number',
		},
		offset: {
			type: 'number',
		},
		sort: {
			type: 'string',
		},
		fields: {
			type: 'string',
		},
		query: {
			type: 'string',
		},
	},
	required: [],
	additionalProperties: false,
};

export const isSettingsGetParams = ajvQuery.compile<SettingsGetParams>(SettingsGetSchema);

export type SettingsBulkProps = {
	settings: { _id: ISetting['_id']; value: ISetting['value']; editor?: ISettingColor['editor'] }[];
};

const SettingsBulkSchema = {
	type: 'object',
	properties: {
		settings: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string', minLength: 1 },
					editor: { type: 'string', enum: ['color', 'expression'] },
					value: {},
				},
				required: ['_id', 'value'],
				additionalProperties: false,
			},
			minItems: 1,
		},
	},
	required: ['settings'],
	additionalProperties: false,
};

export const isSettingsBulkProps = ajv.compile<SettingsBulkProps>(SettingsBulkSchema);

export type SettingsEndpoints = {
	'/v1/settings.public': {
		GET: (params: SettingsPublicWithPaginationProps) => PaginatedResult & {
			settings: Array<ISetting>;
		};
	};

	'/v1/settings.oauth': {
		GET: () => {
			services: Partial<LoginServiceConfiguration>[];
		};
	};

	'/v1/settings.addCustomOAuth': {
		POST: (params: { name: string }) => void;
	};

	'/v1/settings': {
		GET: (params: SettingsGetParams) => {
			settings: ISetting[];
		};
		POST: (params: SettingsBulkProps) => void;
	};

	'/v1/settings/:_id': {
		GET: () => Pick<ISetting, '_id' | 'value'>;
		POST: (params: SettingsUpdateProps) => void;
	};

	'/v1/service.configurations': {
		GET: () => {
			configurations: Array<LoginServiceConfiguration>;
		};
	};
};
