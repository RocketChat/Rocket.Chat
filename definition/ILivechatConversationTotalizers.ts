export interface ILivechatConversationTotalizers {
	totalizers: ITotalizers[];
	success: boolean;
}

interface ITotalizers {
	title: string;
	value: number;
}
