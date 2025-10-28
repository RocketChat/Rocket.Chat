export interface IMethodConnection {
	id: string;
	close(fn: (...args: any[]) => void): void;
	onClose(fn: (...args: any[]) => void): void;
	clientAddress: string;
	httpHeaders: Record<string, any>;
}
