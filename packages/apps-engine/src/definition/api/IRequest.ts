import type { RequestMethod } from '../accessors';
import type { IUser } from '../users';

export interface IApiRequest {
    method: RequestMethod;
    headers: { [key: string]: string };
    query: { [key: string]: string };
    params: { [key: string]: string };
    content: any;
    privateHash?: string;
    /**
     * The user that is making the request, as
     * authenticated by Rocket.Chat's strategy.
     */
    user?: IUser;
}
