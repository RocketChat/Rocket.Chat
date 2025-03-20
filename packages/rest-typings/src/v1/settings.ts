import type { ISetting, ISettingColor, LoginServiceConfiguration } from '@rocket.chat/core-typings';

import { ajv } from './Ajv';
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

export const isSettingsPublicWithPaginationProps = ajv.compile<SettingsPublicWithPaginationProps>(SettingsPublicWithPaginationSchema);

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

export const isSettingsGetParams = ajv.compile<SettingsGetParams>(SettingsGetSchema);

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
