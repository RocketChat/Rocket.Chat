declare module 'ldap-escape' {
	export function filter(strings: TemplateStringsArray, ...values: string[]): string;
	export function dn(strings: TemplateStringsArray, ...values: string[]): string;
}
