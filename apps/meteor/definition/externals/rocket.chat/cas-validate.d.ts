type CBFunction = (err: any, status: boolean, username: string, details: any) => void;

declare module '@rocket.chat/cas-validate' {
	export function validate(options: any, ticket: any, callback: CBFunction): void;
}
