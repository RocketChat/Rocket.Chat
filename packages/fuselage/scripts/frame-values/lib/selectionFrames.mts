import { literal } from './literal.mts';
import type { Value } from './literal.mts';
import { textFrameDefaults } from './textFrameDefaults.mts';
import { offScale, size } from './tokens.mts';

export type SelectionControl = {
	/** The prefix of the constants of its frames, as in `checkBox`. */
	prefix: string;
	radius: string;
	/** What the fake adds to the layout the three controls share. */
	fake: Record<string, Value>;
};

const frameConstant = (name: string, style: Record<string, Value>) => `const ${name} = ${literal(style)} as const;`;

/**
 * The layout of the three frames of a CheckBox, RadioButton or ToggleSwitch: the label, the visually hidden input and
 * the fake that stands in for it. The fake states no color: each one follows the state of the input, in the stylesheet.
 */
export const selectionFrames = ({ prefix, radius, fake }: SelectionControl) => {
	const label = {
		render: 'label',
		flexDirection: 'row',
		flexShrink: 1,
		alignItems: 'normal',
		minWidth: 'auto',
		minHeight: 'auto',
		position: 'relative',
		display: 'inline-flex',
		verticalAlign: 'middle',
		cursor: 'pointer',
		outlineWidth: 0,
	};

	return [
		frameConstant(`${prefix}Label`, { ...textFrameDefaults(label), ...label }),
		frameConstant(`${prefix}Input`, {
			render: 'input',
			flexDirection: 'row',
			flexShrink: 1,
			alignItems: 'normal',
			minWidth: 'auto',
			minHeight: 'auto',
			position: 'absolute',
			display: 'block',
			overflow: 'hidden',
			clipPath: 'inset(50%)',
			width: offScale(1),
			height: offScale(1),
			margin: offScale(-1),
			padding: 0,
			whiteSpace: 'nowrap',
			borderWidth: 0,
		}),
		frameConstant(`${prefix}Fake`, {
			render: 'i',
			flexDirection: 'row',
			flexShrink: 1,
			alignItems: 'normal',
			minWidth: 'auto',
			minHeight: 'auto',
			position: 'relative',
			height: size('x20'),
			borderWidth: offScale(1),
			borderRadius: radius,
			...fake,
		}),
	].join('\n\n');
};
