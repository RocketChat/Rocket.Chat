import type { IEnvironmentRead, IHttp, IRead } from '.';
import type { IServerEndpoints } from './IServerEndpoints';
import type { IApiEndpointMetadata } from '../api';
import type { IEnvironmentWrite } from './IEnvironmentWrite';

export interface IAppAccessors {
	readonly environmentReader: IEnvironmentRead;
	readonly environmentWriter: IEnvironmentWrite;
	readonly reader: IRead;
	readonly http: IHttp;
	readonly serverEndpoints: IServerEndpoints;
	readonly providedApiEndpoints: Array<IApiEndpointMetadata>;
}
