/**
 * Tracker on the server behaves like Meteor's: computations run once and
 * never rerun (there is no invalidation source). The meteor-client core is
 * environment-agnostic, so reuse it.
 */
export * from '@rocket.chat/meteor-client/tracker';
