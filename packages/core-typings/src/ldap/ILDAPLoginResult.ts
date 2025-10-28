export interface ILDAPLoginResult extends Record<string, any> {
	userId?: string;
}

export type LDAPLoginResult = ILDAPLoginResult | undefined;
