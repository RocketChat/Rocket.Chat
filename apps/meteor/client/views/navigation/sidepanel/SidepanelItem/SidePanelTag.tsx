import type { TagProps } from '@rocket.chat/fuselage';
import { Tag } from '@rocket.chat/fuselage';

export type SidePanelTagProps = TagProps;

const SidePanelTag = (props: SidePanelTagProps) => <Tag role='button' tabIndex={0} {...props} maxWidth='50%' flexShrink={1} flexGrow={0} />;

export default SidePanelTag;
