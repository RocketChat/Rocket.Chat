/** The external device (e.g. a desk phone) a user chose to take media calls on, instead of Rocket.Chat. */
export interface IUserMediaCallDevice {
	/** Device id as the providing app reported it. */
	id: string;
	/** The app that provides the device. */
	appId: string;
	/** Name as it was when the user chose it. */
	name?: string;
}
