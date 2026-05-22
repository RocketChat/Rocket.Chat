export type MitelConfig = {
	host: string;
	username: string;
	password: string;
};

export type MitelCallItem = {
	directoryNumber?: string;
	name?: string;
	callIdentity?: string;
	dateTime: Date | null;
	timeZone?: string;
	duration: number;
	typeOfCall?: 'incoming-answered' | 'incoming-missed' | 'outgoing';
	transferredCall: boolean;
	divertedCall: boolean;
	firstDialledNumber?: string;
	remoteNumber?: string;
	directoryNumber2?: string;
	name2?: string;
	infoText2?: string;
};
