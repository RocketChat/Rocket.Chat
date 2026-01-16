import { SessionContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';

interface ISession {
  /**
   * Test if a session variable is equal to a value. If inside a
   * reactive computation, invalidate the computation the next
   * time the variable changes to or from the value.
   * @param key The name of the session variable to test
   * @param value The value to test against
   */
	equals(key: string, value: string | number | boolean | any): boolean;

  /**
   * Get the value of a session variable. If inside a reactive
   * computation, invalidate the computation the next time the
   * value of the variable is changed by `Session.set`. This
   * returns a clone of the session value, so if it's an object or an array,
   * mutating the returned value has no effect on the value stored in the
   * session.
   * @param key The name of the session variable to return
   */
   get(key: string): any;

  /**
   * Set a variable in the session. Notify any listeners that the value
   * has changed (eg: redraw templates, and rerun any
   * `Tracker.autorun` computations, that called
   * `Session.get` on this `key`.)
   * @param key The key to set, eg, `selectedItem`
   * @param value The new value for `key`
   */
   set(key: string, value: EJSONable | any): void;

  /**
   * Set a variable in the session if it hasn't been set before.
   * Otherwise works exactly the same as `Session.set`.
   * @param key The key to set, eg, `selectedItem`
   * @param value The new value for `key`
   */
   setDefault(key: string, value: EJSONable | any): void;
}

const session: ISession = {
	equals(key, value) {
		return sessionStorage.getItem(key) === JSON.stringify(value);	
	},
	get(key) {
		const value = sessionStorage.getItem(key);
		return value ? JSON.parse(value) : undefined;
	},
	set(key, value) {
		sessionStorage.setItem(key, JSON.stringify(value));
	},
	setDefault(key, value) {
		if (sessionStorage.getItem(key) === null) {
			sessionStorage.setItem(key, JSON.stringify(value));
		}
	}
}

const contextValue = {
	query: createReactiveSubscriptionFactory<unknown>((name) => session.get(name)),
	dispatch: (name: string, value: unknown): void => {
		session.set(name, value);
	},
};

type SessionProviderProps = {
	children?: ReactNode;
};

const SessionProvider = ({ children }: SessionProviderProps) => (
	<SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>
);

export default SessionProvider;
