import { isExchangeError } from '../errors';
import { logger } from '../logger';
import { MAX_THROTTLED_MAILBOXES_IN_A_ROW } from './limits';

export const createThrottledStreak = (): ((error: unknown) => boolean) => {
	let inARow = 0;

	return (error) => {
		inARow = isExchangeError(error) && error.code === 'mailbox-rate-limited' ? inARow + 1 : 0;

		if (inARow === MAX_THROTTLED_MAILBOXES_IN_A_ROW) {
			logger.warn({ msg: 'Stopping the Exchange sync run: mailboxes keep coming back throttled', inARow });
		}

		return inARow >= MAX_THROTTLED_MAILBOXES_IN_A_ROW;
	};
};
