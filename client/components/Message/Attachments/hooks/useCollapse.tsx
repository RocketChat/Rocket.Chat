import React from 'react'
import { useToggle } from '@rocket.chat/fuselage-hooks';

import { Attachment } from '../Attachment';

export const useCollapse = (collapsedDefault: boolean): [boolean, JSX.Element] => {
    const [collapsed, toogleCollapsed] = useToggle(collapsedDefault);
   return [collapsed, <Attachment.Collapse collapsed={collapsed} onClick={toogleCollapsed as any} />];
}
