/**
 * The rules for handing an omnichannel chat to someone else: what the request looks like once a target
 * is chosen, and which of the two targets the agent may still pick.
 */

export type ForwardChatInput = {
	department?: string;
	username?: string;
	comment?: string;
};

export type ForwardChatTarget = {
	departmentId?: string;
	userId?: string;
	comment?: string;
};

export type ForwardChatRequest = {
	roomId: string;
	departmentId?: string;
	userId?: string;
	comment?: string;
	clientAction: boolean;
};

export type ForwardChatFieldStates = {
	canPickDepartment: boolean;
	canPickAgent: boolean;
	canForward: boolean;
};

export const buildForwardChatRequest = (
	roomId: string,
	{ departmentId, userId, comment }: ForwardChatTarget,
): ForwardChatRequest | null => {
	// A chat goes to a department or to an agent, so naming both is not a request we can make.
	if (departmentId && userId) {
		return null;
	}

	return {
		roomId,
		comment,
		clientAction: true,
		...(departmentId && { departmentId }),
		...(userId && { userId }),
	};
};

export const getForwardChatFieldStates = ({ department, username }: ForwardChatInput): ForwardChatFieldStates => ({
	canPickDepartment: !username,
	canPickAgent: !department,
	canForward: Boolean(department || username),
});
