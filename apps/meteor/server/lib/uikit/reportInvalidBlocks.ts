import { ClientSafeError } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { maxBlocksPerMessage, maxBlocksPerView, maxChartsPerMessage, validateLayoutBlocks } from '@rocket.chat/ui-kit/validateLayoutBlocks';

import { settings } from '../../settings';

const logger = new Logger('UiKit');

const maxReportedErrors = 10;

type Source = {
	/** Which path the blocks came through, such as `message` or `ui.interaction`. */
	where: string;
	appId?: string;
	rid?: string;
	userId?: string;
};

const rejectsInvalidBlocks = () => settings.get<boolean>('UiKit_Reject_Invalid_Blocks') === true;

const logInvalidBlocks = (blocks: unknown, source: Source, maxBlocks: number, maxCharts?: number) => {
	const errors = validateLayoutBlocks(blocks, maxBlocks, { maxCharts });

	if (errors.length > 0) {
		logger.warn({ msg: 'Invalid UiKit blocks', ...source, errors: errors.slice(0, maxReportedErrors), errorCount: errors.length });
	}

	return errors;
};

/**
 * Logs where the blocks of a message depart from the UiKit types or limits, so the apps that send them can be found
 * and fixed. With `UiKit_Reject_Invalid_Blocks` on, the message is refused instead.
 */
export const reportInvalidBlocks = (blocks: unknown, source: Source): void => {
	if (blocks === undefined) {
		return;
	}

	const errors = logInvalidBlocks(blocks, source, maxBlocksPerMessage, maxChartsPerMessage);

	if (errors.length > 0 && rejectsInvalidBlocks()) {
		const reasons = errors.slice(0, 3).map(({ path, expected }) => `${path}: expected ${expected}`);

		throw new ClientSafeError('error-invalid-blocks', `Invalid blocks: ${reasons.join('; ')}`, {
			errors: errors.slice(0, maxReportedErrors),
		});
	}
};

/**
 * Logs invalid blocks in the view an app opens or updates through a UiKit interaction. Returns whether the
 * interaction must be dropped: it must when `UiKit_Reject_Invalid_Blocks` is on, because the user cannot act on it.
 */
export const reportInvalidInteractionBlocks = (interaction: unknown, source: Source): boolean => {
	if (typeof interaction !== 'object' || interaction === null || !('view' in interaction)) {
		return false;
	}

	const { view } = interaction as { view?: { blocks?: unknown } };

	if (view?.blocks === undefined) {
		return false;
	}

	return logInvalidBlocks(view.blocks, source, maxBlocksPerView).length > 0 && rejectsInvalidBlocks();
};
