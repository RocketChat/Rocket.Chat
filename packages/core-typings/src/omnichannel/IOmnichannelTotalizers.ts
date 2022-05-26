export interface IOmnichannelTotalizers {
	totalizers: { title: string; value: number | string }[];
}

export interface IConversationTotalizers extends IOmnichannelTotalizers {
	totalizers: [
		{
			title: 'Total_conversations';
			value: number;
		},
		{
			title: 'Open_conversations';
			value: number;
		},
		{
			title: 'Total_messages';
			value: number;
		},
		{
			title: 'On_Hold_conversations';
			value: number;
		},
		{
			title: 'Total_visitors';
			value: number;
		},
	];
}

export interface IAgentProductivityTotalizers extends IOmnichannelTotalizers {
	totalizers: [
		{
			title: 'Busiest_time';
			value: string;
		},
		{
			title: 'Avg_of_available_service_time';
			value: string;
		},
		{
			title: 'Avg_of_service_time';
			value: string;
		},
	];
}

export interface IChatTotalizers extends IOmnichannelTotalizers {
	totalizers: [
		{
			title: 'Avg_of_abandoned_chats';
			value: string;
		},
		{
			title: 'Avg_of_chat_duration_time';
			value: string;
		},
		{
			title: 'Total_abandoned_chats';
			value: number;
		},
	];
}

export interface IProductivityTotalizers extends IOmnichannelTotalizers {
	totalizers: [
		{
			title: 'Avg_response_time';
			value: string;
		},
		{
			title: 'Avg_first_response_time';
			value: string;
		},
		{
			title: 'Avg_reaction_time';
			value: string;
		},
		{
			title: 'Avg_of_waiting_time';
			value: string;
		},
	];
}
