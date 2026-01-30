declare module 'meteor/meteor' {
	namespace Meteor {
		interface UserServices {
			totp?: {
				enabled: boolean;
				hashedBackup: string[];
				secret: string;
				tempSecret?: string;
			};
		}
	}
}
