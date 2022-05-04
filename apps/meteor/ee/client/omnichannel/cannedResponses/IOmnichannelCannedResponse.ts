export type IOmnichannelCannedResponse = {
	_id: string;
	shortcut: string;
	text: string;
	scope: string;
	tags: Array<string>;
	_updatedAt: string;
	createdBy: {
		_id: string;
		username: string;
	};
};

export type EndpointResponse = {
	cannedResponses: IOmnichannelCannedResponse[];
	count?: number;
	offset?: number;
	total: number;
};
