/** Server is notifying the client that its registration was processed */
export type ServerMediaSignalRegistered = {
	type: 'registered';

	toContractId: string;

	calls: string[];

	activeCalls: string[];
};
