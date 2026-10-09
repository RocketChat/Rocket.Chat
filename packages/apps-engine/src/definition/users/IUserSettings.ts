/** The preferences a user chose for themselves. */
export interface IUserSettings {
	preferences?: {
		/** The language the user reads Rocket.Chat in. Translate messages to it. */
		language?: string;
	};
}
