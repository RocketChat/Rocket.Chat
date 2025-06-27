import { Tag } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const SidePanelTag = (props: ComponentProps<typeof Tag>) => <Tag role='button' tabIndex={0} {...props} />;

export default SidePanelTag;
