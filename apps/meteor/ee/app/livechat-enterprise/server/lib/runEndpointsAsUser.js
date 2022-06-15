import { Meteor } from 'meteor/meteor';

const replaceOriginalActionToRunAsUser = (route, endpointsToRunAsUser) => {
	endpointsToRunAsUser[route.path].forEach((action) => {
		if (route.endpoints[action]) {
			const originalAction = route.endpoints[action].action;
			route.endpoints[action].action = function _internalRouteActionHandler() {
				return Meteor.runAsUser(this.userId, () => originalAction.apply(this));
			};
		}
	});
};

export function runEndpointsAsUser({ originalAPIRoutes, endpointsToRunAsUser }) {
	originalAPIRoutes
		.filter((route) => Object.keys(endpointsToRunAsUser).includes(route.path))
		.forEach((route) => replaceOriginalActionToRunAsUser(route, endpointsToRunAsUser));
}
