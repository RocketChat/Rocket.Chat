import type { LayoutBlockError } from './validateLayoutBlocks';

export const maxBlocksPerMessage = 50;
export const maxBlocksPerView = 100;

const maxElementsPerActionsBlock = 25;
const maxOptionsPerSelect = 100;
const maxTasksPerPlan = 50;

const maxTextLength = {
	header: 150,
	section: 3000,
	sectionField: 2000,
	button: 75,
	option: 75,
	placeholder: 150,
	label: 2000,
	hint: 2000,
} as const;

type Node = Record<string, unknown>;

const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null && !Array.isArray(value);

const textLimit = (parent: Node, key: string, inFields: boolean): number | undefined => {
	if (inFields) {
		return maxTextLength.sectionField;
	}

	if (key === 'placeholder' || key === 'label' || key === 'hint') {
		return maxTextLength[key];
	}

	if (key !== 'text') {
		return undefined;
	}

	if (parent.type === 'header' || parent.type === 'section' || parent.type === 'button') {
		return maxTextLength[parent.type];
	}

	return parent.type === undefined && 'value' in parent ? maxTextLength.option : undefined;
};

/**
 * Lists where blocks exceed the size limits of the UiKit surfaces. Kept apart from the type validator so the limits
 * stay in one place and cover block types added later; they apply only when blocks are validated, never when rendering.
 */
export const checkBlockLimits = (blocks: unknown, maxBlocks: number): LayoutBlockError[] => {
	const errors: LayoutBlockError[] = [];

	const walk = (value: unknown, path: string, parent: Node | undefined, key: string, inFields: boolean): void => {
		if (Array.isArray(value)) {
			let max: number | undefined;
			if (key === 'options') {
				max = maxOptionsPerSelect;
			} else if (key === 'elements' && parent?.type === 'actions') {
				max = maxElementsPerActionsBlock;
			} else if (key === 'tasks' && parent?.type === 'plan') {
				max = maxTasksPerPlan;
			}

			if (max !== undefined && value.length > max) {
				errors.push({ path, expected: `array of at most ${max} items` });
			}

			value.forEach((item, index) => walk(item, `${path}[${index}]`, parent, key, key === 'fields'));
			return;
		}

		if (!isNode(value)) {
			return;
		}

		if ((value.type === 'plain_text' || value.type === 'mrkdwn') && typeof value.text === 'string') {
			const max = parent && textLimit(parent, key, inFields);

			if (max !== undefined && value.text.length > max) {
				errors.push({ path: `${path}.text`, expected: `string of at most ${max} characters` });
			}

			return;
		}

		for (const [childKey, child] of Object.entries(value)) {
			walk(child, `${path}.${childKey}`, value, childKey, false);
		}
	};

	if (Array.isArray(blocks)) {
		if (blocks.length > maxBlocks) {
			errors.push({ path: '$input', expected: `array of at most ${maxBlocks} blocks` });
		}

		blocks.forEach((block, index) => walk(block, `$input[${index}]`, undefined, '', false));
	}

	return errors;
};
