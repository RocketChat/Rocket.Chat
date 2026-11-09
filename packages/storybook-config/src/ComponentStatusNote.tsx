import type { DocsContextProps } from 'storybook/internal/types';

import { componentStatuses, findComponentStatus, getComponentStatusBadgeStyle } from './status.js';
import { themes, type ThemeMode } from './theme.js';

/** Reads the lifecycle status of the component a docs page documents; pages not attached to stories have none. */
const readComponentStatus = (context: DocsContextProps) => {
	try {
		return findComponentStatus(context.storyById().tags);
	} catch {
		return undefined;
	}
};

type ComponentStatusNoteProps = {
	context: DocsContextProps;
	mode: ThemeMode;
};

/** States the lifecycle status of the documented component, and what it means for whoever adopts it. */
const ComponentStatusNote = ({ context, mode }: ComponentStatusNoteProps) => {
	const componentStatus = readComponentStatus(context);

	if (!componentStatus) {
		return null;
	}

	const { label, description } = componentStatuses[componentStatus];

	return (
		<p
			className='sb-unstyled'
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 8,
				margin: '0 0 16px',
				fontFamily: themes[mode].fontBase,
				fontSize: 14,
				lineHeight: '20px',
			}}
		>
			<span style={getComponentStatusBadgeStyle(componentStatus, mode)}>{label}</span>
			<span style={{ color: themes[mode].textMutedColor }}>{description}</span>
		</p>
	);
};

export default ComponentStatusNote;
