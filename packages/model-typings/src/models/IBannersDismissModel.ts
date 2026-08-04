import type { IBannerDismiss } from '@rocket.chat/core-typings';
import type { Document, FindCursor } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IBannersDismissModel extends IBaseModel<IBannerDismiss> {
	findByUserIdAndBannerId<P extends Document = IBannerDismiss, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(userId: string, bannerIds: string[], options?: O): FindCursor<DocumentWithProjection<P, O>>;
}
