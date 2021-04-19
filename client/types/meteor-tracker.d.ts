declare module 'meteor/tracker' {
	namespace Tracker {
		function nonreactive<T>(func: () => T): T;
	}
}
