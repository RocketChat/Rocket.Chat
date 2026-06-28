import { Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import Emoji from '../../../../components/Emoji';

/**
 * A custom category's sidebar label: its emoji (if set) — otherwise the default folder icon — followed
 * by the name. The emoji is constrained to the folder icon's size (x20) so both render identically.
 * Rendered into the collapser title; the collapser's `aria-label` keeps the plain name, so this only
 * affects the visible text.
 */
const CategoryLabel = ({ icon, name }: { icon?: string; name: string }): ReactElement => (
	<>
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				inlineSize: '1.25rem',
				blockSize: '1.25rem',
				marginInlineEnd: '0.25rem',
				verticalAlign: 'middle',
			}}
		>
			{icon ? <Emoji emojiHandle={`:${icon}:`} fillContainer /> : <Icon name='folder' size='x20' />}
		</span>
		{name}
	</>
);

export default CategoryLabel;
