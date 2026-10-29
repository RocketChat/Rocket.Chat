import type { LicenseInfo, Cloud } from '@rocket.chat/core-typings';

import { ajv, ajvQuery } from './Ajv';

type licensesAddProps = {
	license: string;
};

const licensesAddPropsSchema = {
	type: 'object',
	properties: {
		license: {
			type: 'string',
		},
	},
	required: ['license'],
	additionalProperties: false,
};

export const isLicensesAddProps = ajv.compile<licensesAddProps>(licensesAddPropsSchema);

type licensesInfoProps = {
	loadValues?: boolean;
};

const licensesInfoPropsSchema = {
	type: 'object',
	properties: {
		loadValues: {
			type: 'boolean',
		},
	},
	required: [],
	additionalProperties: false,
};

export const isLicensesInfoProps = ajvQuery.compile<licensesInfoProps>(licensesInfoPropsSchema);

type licensesValidateProps = {
	license: string;
};

const licensesValidatePropsSchema = {
	type: 'object',
	properties: {
		license: {
			type: 'string',
		},
	},
	required: ['license'],
	additionalProperties: false,
};

export const isLicensesValidateProps = ajv.compile<licensesValidateProps>(licensesValidatePropsSchema);

export type LicensesEndpoints = {
	'/v1/licenses.info': {
		GET: (params: licensesInfoProps) => {
			license: LicenseInfo;
			cloudSyncAnnouncement?: Cloud.ICloudSyncAnnouncement;
		};
	};
	'/v1/licenses.add': {
		POST: (params: licensesAddProps) => void;
	};
	'/v1/licenses.validate': {
		POST: (params: licensesValidateProps) => void;
	};
	'/v1/licenses.maxActiveUsers': {
		GET: () => { maxActiveUsers: number | null; activeUsers: number };
	};
	'/v1/licenses.requestSeatsLink': {
		GET: () => { url: string };
	};
};
