// The Meteor bundler resolves npm requires by physical path and doesn't support
// package `exports` subpaths, so runtime code must keep importing the real file
// 'csv-parse/lib/sync'. That path isn't in csv-parse's exports map, which newer
// TypeScript resolution modes enforce — bridge the types to the exports-declared
// entry point.
declare module 'csv-parse/lib/sync' {
	export * from 'csv-parse/sync';
}
