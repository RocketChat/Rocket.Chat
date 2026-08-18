/* eslint-disable react-hooks/rules-of-hooks */
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

	private lastActivityAt = Date.now();

	private idle = false;

	private goOnline: () => Promise<boolean | undefined> = async () => undefined;

	private goAway: () => Promise<boolean | undefined> = async () => undefined;

	private storeUser: (doc: IUser) => void = () => undefined;

	startTimer() {
		this.stopTimer();
		if (!this.awayTime) return;
		const remaining = Math.max(this.awayTime - (Date.now() - this.lastActivityAt), 0);
		this.timer = setTimeout(this.setAway, remaining);
	}

	private stopTimer() {
		clearTimeout(this.timer);
	}

	private readonly registerActivity = () => {
		this.lastActivityAt = Date.now();
		this.idle = false;
		this.setStatus(UserStatus.ONLINE);
	};

	private readonly setAway = () => {
		this.idle = true;
		this.setStatus(UserStatus.AWAY);
	};

	private isIdle(): boolean {
		if (this.awayTime) {
			return Date.now() - this.lastActivityAt >= this.awayTime;
		}
		return this.idle;
	}

	private readonly applyStatus = async (newStatus: UserStatus.ONLINE | UserStatus.AWAY, { force = false } = {}) => {
		if (!this.connected) {
			return;
		}

		if (newStatus === this.status && !force) {
			this.startTimer();
			return;
		}

		if (this.user?.status !== newStatus && this.user?.statusDefault === newStatus) {
			this.storeUser({ ...this.user, status: newStatus });
		}

		switch (newStatus) {
			case UserStatus.ONLINE:
				this.startTimer();
				await this.goOnline();
				break;

			case UserStatus.AWAY:
				this.stopTimer();
				await this.goAway();
				break;
		}

		this.status = newStatus;
	};

	private readonly setStatus = withDebouncing({ wait: 1000 })(this.applyStatus);

	/**
	 * When auto-away is enabled, after a dropped socket, reconnection, or network change,
	 * the server sets the user as online. Since we may have marked the user away in the UI,
	 * we need to re-send away to the server if still idle.
	 */
	private readonly reassertPresence = () => {
		this.setStatus.cancel();

		if (!this.isIdle()) {
			this.status = UserStatus.ONLINE;
			this.startTimer();
			return;
		}

		void this.applyStatus(UserStatus.AWAY, { force: true });
	};

	readonly use = () => {
		const user = useUser() ?? undefined;
		const { connected } = useConnectionStatus();
		const isLoggingIn = useIsLoggingIn();
		const enableAutoAway = useUserPreference<boolean>('enableAutoAway');
		const idleTimeLimit = useUserPreference<number>('idleTimeLimit') ?? 300;
		const { RocketChatDesktop } = window;

		const awayTime = enableAutoAway && !RocketChatDesktop ? idleTimeLimit * 1000 : undefined;

		this.user = user;
		this.connected = connected;
		this.goOnline = useMethod('UserPresence:online');
		this.goAway = useMethod('UserPresence:away');
		this.storeUser = Users.use((state) => state.store);

		useEffect(() => {
			if (!RocketChatDesktop) return;

			RocketChatDesktop.setUserPresenceDetection({
				isAutoAwayEnabled: enableAutoAway ?? false,
				idleThreshold: idleTimeLimit,
				setUserOnline: (online) => {
					if (!online) {
						this.setAway();
						return;
					}
					this.registerActivity();
				},
			});

			return () => {
				RocketChatDesktop.setUserPresenceDetection({
					isAutoAwayEnabled: false,
					idleThreshold: null,
					setUserOnline: () => undefined,
				});
			};
		}, [RocketChatDesktop, enableAutoAway, idleTimeLimit]);

		useEffect(() => {
			if (RocketChatDesktop) return;

			const documentEvents = ['mousemove', 'mousedown', 'touchend', 'keydown'] as const;
			documentEvents.forEach((key) => document.addEventListener(key, this.registerActivity));
			window.addEventListener('focus', this.registerActivity);

			return () => {
				documentEvents.forEach((key) => document.removeEventListener(key, this.registerActivity));
				window.removeEventListener('focus', this.registerActivity);
			};
		}, [RocketChatDesktop]);

		useEffect(() => {
			this.awayTime = awayTime;

			if (!connected) {
				this.setStatus.cancel();
				this.stopTimer();
				this.status = UserStatus.OFFLINE;
				return;
			}

			if (!user?._id || isLoggingIn) return;

			this.reassertPresence();
		}, [connected, isLoggingIn, user?._id, awayTime]);
	};
}
