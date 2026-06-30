import { Divider } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo } from 'react';

import type { BlockProps } from '../utils/BlockProps';

type DividerBlockProps = BlockProps<UiKit.DividerBlock>;

const DividerBlock = ({ className }: DividerBlockProps) => <Divider className={className} marginBlock={24} />;

export default memo(DividerBlock);
