export type Alert = {
	id: string;
	success?: boolean;
	timeout?: number;
	children: string;
	error?: boolean;
	warning?: boolean;
};
