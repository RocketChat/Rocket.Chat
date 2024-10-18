import type { LicenseInfo } from '@rocket.chat/core-typings';
import type { CalloutBlock, ContextBlock, DividerBlock, ImageBlock, SectionBlock } from '@rocket.chat/ui-kit';
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

type CloudSyncAnnouncementLayoutBlock = ContextBlock | DividerBlock | ImageBlock | SectionBlock | CalloutBlock;
type CloudSyncAnnouncementLayout = CloudSyncAnnouncementLayoutBlock[];

export type LicensesEndpoints = {
	'/v1/licenses.info': {
		GET: (params: licensesInfoProps) => {
			license: LicenseInfo;
			cloudSyncAnnouncement?: {
				viewId: string;
				appId: string;
				blocks: CloudSyncAnnouncementLayout[];
			};
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
