export interface IAttributeMapping {
	fieldName: string | Array<string>;
	regex?: string;
	template?: string;
}

export interface IUserDataMap {
	attributeList: Set<string>;
	identifier: {
		type: string;
		attribute?: string;
	};
	email: IAttributeMapping;
	username: IAttributeMapping;
	name: IAttributeMapping;
}
