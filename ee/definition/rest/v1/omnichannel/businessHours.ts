// import { API } from '../../../../../app/api/server';
import { ILivechatBusinessHour } from '../../../../../definition/ILivechatBusinessHour';
// import { findBusinessHours } from '../business-hour/lib/business-hour';

// API.v1.addRoute('livechat/business-hours.list', { authRequired: true }, {
// 	get() {
// 		const { offset, count } = this.getPaginationItems();
// 		const { sort } = this.parseJsonQuery();
// 		const { name } = this.queryParams;

// 		// @ts-ignore
// 		return API.v1.success(Promise.await(findBusinessHours(
// 			this.userId,
// 			{
// 				offset,
// 				count,
// 				sort,
// 			},
// 			name)));
// 	},
// });


// import { IDirectMessageRoom, IRoom } from '../../../../definition/IRoom';
// import { IDailyActiveUsers } from '../../../../definition/IUser';
// import { Serialized } from '../../../../definition/Serialized';

export type OmnichannelBusinessHoursEndpoints = {
	'livechat/business-hours.list': {
		GET: () => ({ businessHours: ILivechatBusinessHour[] });
	};
}
