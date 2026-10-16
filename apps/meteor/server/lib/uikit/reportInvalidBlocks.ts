import { Logger } from '@rocket.chat/logger';
import { validateLayoutBlocks } from '@rocket.chat/ui-kit/dist/blocks/validateLayoutBlocks';

const logger = new Logger('UiKit');

const maxReportedErrors = 10;

type Source = {
	/** Which path the blocks came through, such as `message` or `ui.interaction`. */
	where: string;
	appId?: string;
	rid?: string;
	userId?: string;
};

// ponytail: logs only, so apps sending invalid blocks keep working; reject them once apps had a release to fix what this reports
/** Logs where blocks depart from the UiKit types, so the apps that send them can be found and fixed. */
export const reportInvalidBlocks = (blocks: unknown, source: Source): void => {
	if (blocks === undefined) {
		return;
	}

	const errors = validateLayoutBlocks(blocks);

	if (errors.length === 0) {
		return;
	}

	logger.warn({ msg: 'Invalid UiKit blocks', ...source, errors: errors.slice(0, maxReportedErrors), errorCount: errors.length });
};

/** Logs invalid blocks in the view an app opens or updates through a UiKit interaction. */
export const reportInvalidInteractionBlocks = (interaction: unknown, source: Source): void => {
	if (typeof interaction !== 'object' || interaction === null || !('view' in interaction)) {
		return;
	}

	const { view } = interaction as { view?: { blocks?: unknown } };
	reportInvalidBlocks(view?.blocks, source);
};
