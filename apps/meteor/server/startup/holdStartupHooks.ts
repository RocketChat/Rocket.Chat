import { Meteor } from 'meteor/meteor';

// Meteor runs startup hooks only after the main module, top-level awaits included, has loaded.
// A bundle that Meteor loads outside its own module system (rspack) reports itself loaded right away,
// so hooks registered while the app loads are held until main.ts releases them.
const { startup } = Meteor;
const heldHooks: Parameters<typeof startup>[0][] = [];

Meteor.startup = (callback) => {
	heldHooks.push(callback);
};

export const releaseStartupHooks = () => {
	Meteor.startup = startup;
	heldHooks.splice(0).forEach((callback) => startup(callback));
};
