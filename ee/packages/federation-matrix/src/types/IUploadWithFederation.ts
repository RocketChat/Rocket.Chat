import type { IUpload } from '@rocket.chat/core-typings';

export interface IFederationMetadata {
	type: 'matrix';
	mxcUri: string;
	isRemote: boolean;
	serverName?: string;
	mediaId?: string;
	uploadToken?: string;
	origin?: string;
}

export interface IUploadWithFederation extends IUpload {
	federation?: IFederationMetadata;
}