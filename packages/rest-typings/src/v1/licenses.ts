import type { LicenseInfo, Cloud } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

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

export const isLicensesInfoProps = ajv.compile<licensesInfoProps>(licensesInfoPropsSchema);

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
	'/v1/licenses.maxActiveUsers': {
		GET: () => { maxActiveUsers: number | null; activeUsers: number };
	};
	'/v1/licenses.requestSeatsLink': {
		GET: () => { url: string };
	};
};
