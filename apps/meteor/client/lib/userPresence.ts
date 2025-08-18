import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { useConnectionStatus, useIsLoggingIn, useMethod, useUser, useUserPreference } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { withDebouncing } from '../../lib/utils/highOrderFunctions';
import { Users } from '../stores';

// TODO: merge this with the current React-based implementation of idle detection

export class UserPresence {
	private user: IUser | undefined;

	private timer: ReturnType<typeof setTimeout> | undefined;

	private status: UserStatus | undefined;

	private awayTime: number | undefined = 60_000;

	private connected = true;

	private goOnline: () => Promise<boolean | undefined> = async () => undefined;

	private goAway: () => Promise<boolean | undefined> = async () => undefined;

	private storeUser: (doc: IUser) => void = () => undefined;

	startTimer() {
		this.stopTimer();
		if (!this.awayTime) return;

		this.timer = setTimeout(this.setAway, this.awayTime);
	}

	private stopTimer() {
		clearTimeout(this.timer);
	}

	private readonly setOnline = () => this.setStatus(UserStatus.ONLINE);

	private readonly setAway = () => this.setStatus(UserStatus.AWAY);

	private readonly setStatus = withDebouncing({ wait: 1000 })(async (newStatus: UserStatus.ONLINE | UserStatus.AWAY) => {
		if (!this.connected || newStatus === this.status) {
			this.startTimer();
			return;
		}

		if (this.user?.status !== newStatus && this.user?.statusDefault === newStatus) {
			this.storeUser({ ...this.user, status: newStatus });
		}

		switch (newStatus) {
			case UserStatus.ONLINE:
				await this.goOnline();
				break;

			case UserStatus.AWAY:
				await this.goAway();
				this.stopTimer();
				break;
		}

		this.status = newStatus;
	});

	readonly use = () => {
		const user = useUser() ?? undefined;
		const { connected } = useConnectionStatus();
		const isLoggingIn = useIsLoggingIn();
		const enableAutoAway = useUserPreference<boolean>('enableAutoAway');
		const idleTimeLimit = useUserPreference<number>('idleTimeLimit') ?? 300;

		this.user = user;
		this.connected = connected;
		this.awayTime = enableAutoAway ? idleTimeLimit * 1000 : undefined;
		this.goOnline = useMethod('UserPresence:online');
		this.goAway = useMethod('UserPresence:away');
		this.storeUser = Users.use((state) => state.store);

		useEffect(() => {
			const documentEvents = ['mousemove', 'mousedown', 'touchend', 'keydown'] as const;
			documentEvents.forEach((key) => document.addEventListener(key, this.setOnline));
			window.addEventListener('focus', this.setOnline);

			return () => {
				documentEvents.forEach((key) => document.removeEventListener(key, this.setOnline));
				window.removeEventListener('focus', this.setOnline);
			};
		}, []);

		useEffect(() => {
			if (!user || !connected || isLoggingIn) return;
			this.startTimer();
		}, [connected, isLoggingIn, user]);

		useEffect(() => {
			if (connected) {
				this.startTimer();
				this.status = UserStatus.ONLINE;
				return;
			}
			this.stopTimer();
			this.status = UserStatus.OFFLINE;
		}, [connected]);
	};
}
