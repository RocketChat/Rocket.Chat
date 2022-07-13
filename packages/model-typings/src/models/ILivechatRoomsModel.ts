import type { IRocketChatRecord } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

type Period = {
	start: any;
	end: any;
};

type WithDepartment = {
	departmentId: any;
};

type WithOnlyCount = {
	onlyCount?: boolean;
};

type WithOptions = {
	options?: any;
};

export interface ILivechatRoomsModel extends IBaseModel<IRocketChatRecord> {
	getQueueMetrics(params: { departmentId: any; agentId: any; includeOfflineAgents: any; options?: any }): any;

	findAllNumberOfAbandonedRooms(params: Period & WithDepartment & WithOnlyCount & WithOptions): Promise<any>;

	findPercentageOfAbandonedRooms(params: Period & WithDepartment & WithOnlyCount & WithOptions): Promise<any>;

	findAllAverageOfChatDurationTime(params: Period & WithDepartment & WithOnlyCount & WithOptions): any;

	findAllAverageWaitingTime(params: Period & WithDepartment & WithOnlyCount & WithOptions): any;

	findAllRooms(params: Period & WithDepartment & WithOnlyCount & WithOptions & { answered: any }): any;

	findAllServiceTime(params: Period & WithDepartment & WithOnlyCount & WithOptions): any;

	findAllNumberOfTransferredRooms(params: Period & WithDepartment & WithOptions): any;

	countAllOpenChatsBetweenDate(params: Period & WithDepartment): any;

	countAllClosedChatsBetweenDate(params: Period & WithDepartment): any;

	countAllQueuedChatsBetweenDate(params: Period & WithDepartment): any;

	countAllOpenChatsByAgentBetweenDate(params: Period & WithDepartment): any;

	countAllOnHoldChatsByAgentBetweenDate(params: Period & WithDepartment): any;

	countAllClosedChatsByAgentBetweenDate(params: Period & WithDepartment): any;

	countAllOpenChatsByDepartmentBetweenDate(params: Period & WithDepartment): any;

	countAllClosedChatsByDepartmentBetweenDate(params: Period & WithDepartment): any;

	calculateResponseTimingsBetweenDates(params: Period & WithDepartment): any;

	calculateReactionTimingsBetweenDates(params: Period & WithDepartment): any;

	calculateDurationTimingsBetweenDates(params: Period & WithDepartment): any;

	findAllAverageOfServiceTime(params: Period & WithDepartment & WithOnlyCount & WithOptions): any;

	findByVisitorId(visitorId: any, options: any): any;

	findPaginatedByVisitorId(visitorId: any, options: any): any;

	findRoomsByVisitorIdAndMessageWithCriteria(params: {
		visitorId: any;
		searchText: any;
		open: any;
		served: any;
		onlyCount?: boolean;
		options?: any;
	}): any;

	findRoomsWithCriteria(params: {
		agents: any;
		roomName: any;
		departmentId: any;
		open: any;
		served: any;
		createdAt: any;
		closedAt: any;
		tags: any;
		customFields: any;
		visitorId: any;
		roomIds: any;
		onhold: any;
		options?: any;
	}): any;

	getOnHoldConversationsBetweenDate(from: any, to: any, departmentId: any): any;

	findAllServiceTimeByAgent(params: Period & WithOptions & WithOnlyCount): any;

	findAllAverageServiceTimeByAgents(params: Period & WithOptions & WithOnlyCount): any;

	setDepartmentByRoomId(roomId: any, departmentId: any): any;

	findOpen(): any;
}
