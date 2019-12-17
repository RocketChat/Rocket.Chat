export interface IMethodThisType {
	isSimulation: boolean;
	userId: string | null;
	connection: any | null;
	setUserId(userId: string): void;
	unblock(): void;
	twoFactorChecked: boolean | undefined;
}
