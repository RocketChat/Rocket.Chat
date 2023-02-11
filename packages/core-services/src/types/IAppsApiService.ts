import type { IApiEndpoint } from '@rocket.chat/apps-engine/definition/api';
import type { Request, Response } from 'express';

export interface IRequestWithPrivateHash extends Request {
	_privateHash?: string;
	content?: any;
}

export interface IAppsApiService {
	handlePublicRequest(req: Request, res: Response): Promise<void>;
	handlePrivateRequest(req: IRequestWithPrivateHash, res: Response): Promise<void>;
	registerApi(endpoint: IApiEndpoint, appId: string): void;
	unregisterApi(appId: string): void;
}
