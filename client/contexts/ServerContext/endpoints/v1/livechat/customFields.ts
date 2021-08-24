export type LivechatCustomFieldsEndpoint = {
	GET: (params: {}) => {
		customFields: [
			{
				_id: string;
				label: string;
			},
		];
	};
};
