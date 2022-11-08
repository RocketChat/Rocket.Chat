export interface IQueueSummary {
	name: string;
	loggedin: string;
	available: string;
	callers: string;
	holdtime: string;
	talktime: string;
	logestholdtime: string;
}
export interface IQueueMember {
	name: string;
	location: string;
	stateinterface: string;
	membership: string;
	penalty: string;
	callstaken: string;
	lastcall: string;
	lastpause: string;
	incall: string;
	status: string;
	paused: string;
	pausedreason: string;
	wrapuptime: string;
}
export interface IQueueDetails {
	name: string;
	strategy: string;
	calls: string;
	holdtime: string;
	talktime: string;
	completed: string;
	abandoned: string;
	logestholdtime: string;
	members: IQueueMember[];
}
