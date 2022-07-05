export interface IMethodConnection {
	id: string;
	close(fn: (...args: any[]) => void): void;
	onClose(fn: (...args: any[]) => void): void;
	clientAddress: string;
	httpHeaders: Record<string, any>;
}

export interface IMethodThisType {
	isSimulation: boolean;
	userId: string | null;
	connection: IMethodConnection | null;
	setUserId(userId: string): void;
	unblock(): void;
	twoFactorChecked: boolean | undefined;
}
