import { join } from 'node:path';

import { elevation } from './lib/elevation.mts';
import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { surfaceColors } from '../../src/Theme.ts';
import { borderRadius, spacing } from '../../src/styleTokens.ts';

const generateTile = () => {
	const frame = {
		render: 'div',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		color: textIconColor('font-default'),
		borderRadius: themed('tile-border-radius', borderRadius('medium')),
		backgroundColor: surfaceColors['surface-light'].toString(),
		...font('p2'),
	};

	const paddings = {
		regular: { padding: spacing('x16') },
		flush: { padding: 0 },
	};

	// The no-border levels have never had a rule: they leave the shadow to the surface
	const { '0': none, '1': one, '2': two } = elevation();
	const elevations = { '0': none, '1': one, '2': two, '1nb': {}, '2nb': {} };

	return [
		`const tileFrame = ${literal({ ...textFrameDefaults(frame), ...frame })} as const;`,
		`const tileDensities = ${literal(paddings)} as const;`,
		`const tileElevations = ${literal(elevations)} as const;`,
	].join('\n\n');
};

const targets: Target[] = [{ file: join(import.meta.dirname, '../../src/components/Tile/Tile.tsx'), generate: generateTile }];

export default targets;
