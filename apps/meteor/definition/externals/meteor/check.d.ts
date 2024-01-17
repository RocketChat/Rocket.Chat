import 'meteor/check';

declare module 'meteor/check' {
	namespace Match {
		function Where<T, U extends T>(condition: (val: T) => val is U): Matcher<U>;
	}
}
