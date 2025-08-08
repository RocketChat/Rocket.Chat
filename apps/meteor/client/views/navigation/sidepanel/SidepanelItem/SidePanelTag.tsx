import { Tag } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const SidePanelTag = (props: ComponentProps<typeof Tag>) => (
	<Tag role='button' tabIndex={0} {...props} maxWidth='50%' flexShrink={1} flexGrow={0} />
);

export default SidePanelTag;
