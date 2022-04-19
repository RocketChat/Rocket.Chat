export interface ISAMLUser {
	emailList: Array<string>;
	fullName: string | null;
	roles?: Array<string>;
	eppn: string | null;

	username?: string;
	language?: string;
	channels?: Array<string>;
	samlLogin: {
		provider: string | null;
		idp: string;
		idpSession: string;
		nameID: string;
	};

	attributeList: Map<string, any>;
	identifier: {
		type: string;
		attribute?: string;
	};
}
