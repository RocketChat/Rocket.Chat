/* eslint-disable react-hooks/rules-of-hooks */
import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { useConnectionStatus, useIsLoggingIn, useMethod, useUser, useUserPreference } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { withDebouncing } from '../../lib/utils/highOrderFunctions';
import { Users } from '../stores';

// TODO: merge this with the current React-based implementation of idle detection

// `UserPresence:away` only sticks after the server has registered the new DDP session
// (`Presence.newConnection`, triggered by the login that follows a reconnection). The login method
// may resolve on the client before that write lands, so the assertion is retried while the server
// reports that no connection was updated.
const AWAY_ASSERTION_ATTEMPTS = 3;
const AWAY_ASSERTION_RETRY_DELAY = 500;

export class UserPresence {
	private user: IUser | undefined;

	private timer: ReturnType<typeof setTimeout> | undefined;

	private status: UserStatus | undefined;

	private awayTime: number | undefined = 60_000;

	private connected = true;

	/** Last time the user interacted with the UI. Kept across connection drops. */
	private lastActivityAt = Date.now();

	/** Idle flag used when there is no local away timer (i.e. presence detection delegated to the desktop app). */
	private idle = false;

	/** Identifies the running away assertion, so a newer one supersedes the retries of the previous. */
	private awayAssertionToken = 0;

	private goOnline: () => Promise<boolean | undefined> = async () => undefined;

	private goAway: () => Promise<boolean | undefined> = async () => undefined;

	private storeUser: (doc: IUser) => void = () => undefined;

	startTimer() {
		this.stopTimer();
		if (!this.awayTime) return;

		// Schedule for the *remaining* idle time so a reconnection doesn't restart the countdown from
		// scratch, keeping an already idle user away instead of granting them another full idle period.
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

	private readonly setAway = () => this.setStatus(UserStatus.AWAY);

	/** Whether the user is idle according to what this client observed, regardless of the connection state. */
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

		this.status = newStatus;

		switch (newStatus) {
			case UserStatus.ONLINE:
				this.idle = false;
				this.startTimer();
				await this.goOnline();
				this.startTimer();
				break;

			case UserStatus.AWAY:
				this.idle = true;
				this.stopTimer();
				await this.assertAway();
				break;
		}
	};

	private readonly setStatus = withDebouncing({ wait: 1000 })(this.applyStatus);

	private async assertAway(): Promise<void> {
		const token = ++this.awayAssertionToken;

		for (let attempt = 1; attempt <= AWAY_ASSERTION_ATTEMPTS; attempt++) {
			// bail out if the user is back online, disconnected, or a newer assertion took over
			if (!this.connected || this.status !== UserStatus.AWAY || token !== this.awayAssertionToken) {
				return;
			}

			if (await this.goAway()) {
				return;
			}

			if (attempt < AWAY_ASSERTION_ATTEMPTS) {
				await new Promise((resolve) => setTimeout(resolve, AWAY_ASSERTION_RETRY_DELAY));
			}
		}
	}

	/**
	 * Restates the presence this client knows about.
	 *
	 * The server registers every new DDP session as online, so any reconnection (dropped socket,
	 * network change, server restart, resumed login) brings the user back to online. The server has no
	 * way to know whether the user interacted with the UI while the socket was down, so the client has
	 * to state it again as soon as the session is authenticated.
	 */
	private readonly reassertPresence = () => {
		this.setStatus.cancel();

		if (!this.isIdle()) {
			// the reconnected session is already online on the server side
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
