import type { ILivechatVisitor } from '@rocket.chat/core-typings';

import type { IAppsVisitor } from '../AppsEngine';

export interface IAppVisitorsConverter {
	convertById(visitorId: ILivechatVisitor['_id']): Promise<IAppsVisitor | undefined>;
	convertByToken(token: string): Promise<IAppsVisitor | undefined>;
	convertVisitor(visitor: undefined | null): Promise<undefined>;
	convertVisitor(visitor: ILivechatVisitor): Promise<IAppsVisitor>;
	convertVisitor(visitor: ILivechatVisitor | undefined | null): Promise<IAppsVisitor | undefined>;
	convertAppVisitor(visitor: undefined | null): undefined;
	convertAppVisitor(visitor: IAppsVisitor): ILivechatVisitor;
	convertAppVisitor(visitor: IAppsVisitor | undefined | null): ILivechatVisitor | undefined;
}
