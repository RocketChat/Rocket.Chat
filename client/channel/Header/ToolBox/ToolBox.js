import React, { memo } from 'react';

import Header from '../../../components/basic/Header';

const ToolBox = () => <>
	<Header.ToolBoxAction icon='magnifier'/>
	<Header.ToolBoxAction icon='key'/>
	<Header.ToolBoxAction icon='team'/>
	<Header.ToolBoxAction icon='kebab'/>
</>;

export default memo(ToolBox);
