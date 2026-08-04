import { Tag } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type SidePanelTagProps = ComponentProps<typeof Tag>;

const SidePanelTag = (props: SidePanelTagProps) => <Tag role='button' tabIndex={0} {...props} maxWidth='50%' flexShrink={1} flexGrow={0} />;

export default SidePanelTag;
