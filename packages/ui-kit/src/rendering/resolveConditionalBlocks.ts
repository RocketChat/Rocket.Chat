import type { Block } from '../blocks/Block';
import { LayoutBlockType } from '../blocks/LayoutBlockType';
import type { ConditionalBlock } from '../blocks/layout/ConditionalBlock';
import type { Conditions } from './Conditions';

const conditionsMatch = (conditions: Conditions | undefined = undefined, filters: ConditionalBlock['when'] = {}): boolean => {
	if (!conditions) {
		return true;
	}

	if (Array.isArray(filters.engine) && !filters.engine.includes(conditions.engine)) {
		return false;
	}

	return true;
};

export const resolveConditionalBlocks =
	(conditions?: Conditions) =>
	(block: Block): readonly Block[] => {
		if (block.type !== LayoutBlockType.CONDITIONAL) {
			return [block];
		}

		if (conditionsMatch(conditions, block.when)) {
			return block.render;
		}

		return [];
	};
