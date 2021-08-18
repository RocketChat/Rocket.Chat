import { ILivechatCustomField } from '../../../../../../definition/ILivechatCustomField';
import { ObjectFromApi } from '../../../../../../definition/ObjectFromApi';

export type LivechatCustomFields = {
	GET: (params: { query: string; offset: number; count: number }) => {
		customFields: ObjectFromApi<ILivechatCustomField[]>;
		total: number;
		count: number;
		offset: number;
	};
};

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
