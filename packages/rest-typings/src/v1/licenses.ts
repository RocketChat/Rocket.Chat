import type { LicenseInfo, LicenseModule } from '@rocket.chat/core-typings';
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

type licensesChangeModulesProps = {
	enable?: { module: LicenseModule }[];
	disable?: { module: LicenseModule }[];
};

const licensesChangeModulesPropsSchema = {
	type: 'object',
	properties: {
		enable: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					module: {
						type: 'string',
					},
				},
				required: ['module'],
			},
		},
		disable: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					module: {
						type: 'string',
					},
				},
				required: ['module'],
			},
		},
	},
	required: [],
	additionalProperties: false,
};

export const isLicensesChangeModules = ajv.compile<licensesChangeModulesProps>(licensesChangeModulesPropsSchema);

export type LicensesEndpoints = {
	'/v1/licenses.info': {
		GET: (params: licensesInfoProps) => {
			license: LicenseInfo;
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
	'/v1/licenses.changeModules': {
		POST: (params: licensesChangeModulesProps) => void;
	};
};
