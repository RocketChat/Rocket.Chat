import type * as MessageParser from '@rocket.chat/message-parser';

const isOrderedItem = (item: MessageParser.ListItem): boolean => item.number !== undefined;

export const splitListItemRuns = (items: MessageParser.ListItem[]): MessageParser.ListItem[][] => {
	const runs: MessageParser.ListItem[][] = [];

	for (const item of items) {
		const lastRun = runs[runs.length - 1];
		if (!lastRun || isOrderedItem(lastRun[0]) !== isOrderedItem(item)) {
			runs.push([item]);
			continue;
		}

		lastRun.push(item);
	}

	return runs;
};

export const isOrderedListRun = (items: MessageParser.ListItem[]): boolean => isOrderedItem(items[0]);
