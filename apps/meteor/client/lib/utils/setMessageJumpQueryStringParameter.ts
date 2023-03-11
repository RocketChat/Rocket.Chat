import type { IMessage } from '@rocket.chat/core-typings';
import { FlowRouter } from 'meteor/kadira:flow-router';

export const setMessageJumpQueryStringParameter = async (msg: IMessage['_id'] | null) => {
	FlowRouter.setQueryParams({ msg });
};
