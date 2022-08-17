import 'meteor/meteor';

declare module 'meteor/meteor' {
	namespace Meteor {
		namespace Device {
			export function isPhone(): boolean;
		}
	}
}
