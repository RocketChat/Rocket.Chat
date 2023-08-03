import type { IApiEndpoint } from '@rocket.chat/apps-engine/definition/api';
import type { Serialized } from '@rocket.chat/core-typings';
import type { Request, Response } from 'express';

export interface IRequestWithPrivateHash extends Serialized<Request> {
	_privateHash?: string;
}

export type AppsApiServiceResponse = {
	statusCode: number;
	headers?: Record<string, string>;
	body?: string;
};

export interface IAppsApiService {
	handlePublicRequest(req: Serialized<Request>, res: Response): Promise<AppsApiServiceResponse>;
	handlePrivateRequest(req: IRequestWithPrivateHash, res: Response): Promise<AppsApiServiceResponse>;
	registerApi(endpoint: IApiEndpoint, appId: string): Promise<void>;
	unregisterApi(appId: string): Promise<void>;
}
