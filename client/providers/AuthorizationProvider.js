import React from 'react';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';

import {
	hasPermission,
	hasAtLeastOnePermission,
	hasAllPermission,
} from '../../app/authorization/client/hasPermission';
import { AuthorizationContext } from '../contexts/AuthorizationContext';
import { hasRole } from '../../app/authorization/client';

const contextValue = {
	hasPermission: (permission, scope, listener) => {
		if (!listener) {
			return Tracker.nonreactive(() => hasPermission(permission, scope));
		}

		const computation = Tracker.autorun(({ firstRun }) => {
			const value = hasPermission(permission, scope);
			if (!firstRun) {
				listener(value);
			}
		});

		return () => {
			computation.stop();
		};
	},
	hasAtLeastOnePermission: (permissions, scope, listener) => {
		if (!listener) {
			return Tracker.nonreactive(() => hasAtLeastOnePermission(permissions, scope));
		}

		const computation = Tracker.autorun(({ firstRun }) => {
			const value = hasAtLeastOnePermission(permissions, scope);
			if (!firstRun) {
				listener(value);
			}
		});

		return () => {
			computation.stop();
		};
	},
	hasAllPermissions: (permissions, scope, listener) => {
		if (!listener) {
			return Tracker.nonreactive(() => hasAllPermission(permissions, scope));
		}

		const computation = Tracker.autorun(({ firstRun }) => {
			const value = hasAllPermission(permissions, scope);
			if (!firstRun) {
				listener(value);
			}
		});

		return () => {
			computation.stop();
		};
	},
	hasRole: (role, listener) => {
		if (!listener) {
			return Tracker.nonreactive(() => hasRole(Meteor.userId(), role));
		}

		const computation = Tracker.autorun(({ firstRun }) => {
			const value = hasRole(Meteor.userId(), role);
			if (!firstRun) {
				listener(value);
			}
		});

		return () => {
			computation.stop();
		};
	},
};

export function AuthorizationProvider({ children }) {
	return <AuthorizationContext.Provider children={children} value={contextValue} />;
}
