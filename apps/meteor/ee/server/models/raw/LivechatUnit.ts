import { IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import type { ILivechatUnitModel } from '@rocket.chat/model-typings';
import type { FindOptions, Filter, FindCursor } from 'mongodb';

import { LivechatDepartmentRaw } from '../../../../server/models/raw/LivechatDepartment';

export class LivechatUnitRaw extends LivechatDepartmentRaw implements ILivechatUnitModel {
    findPaginatedUnits(query: Filter<IOmnichannelBusinessUnit>, options?: FindOptions<IOmnichannelBusinessUnit>): FindCursor<IOmnichannelBusinessUnit> {
        // @ts-expect-error - This extend from LivechatDepartment messes up with the types
        return super.findPaginated({ ...query, type: 'u' }, options);
    }
}
