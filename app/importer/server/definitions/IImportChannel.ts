export interface IImportChannel {
	_id?: string;
	u?: {
		_id?: string;
		username?: string;
	};
	name: string;
	users: Array<string>;
	importIds: Array<string>;
	t: string;
	topic?: string;
	description?: string;
	ts?: Date;

	// Determine if the values in the 'u' object are relative to the Rocket.Chat data or to imported data
	userType: 'rocket.chat' | 'imported';
}
