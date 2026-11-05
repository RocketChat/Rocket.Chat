import { memo } from 'react';

import { ButtonGroup, type ButtonGroupProps } from '../ButtonGroup';

export type ContextualbarActionsProps = ButtonGroupProps;

const ContextualbarActions = (props: ContextualbarActionsProps) => <ButtonGroup {...props} />;

export default memo(ContextualbarActions);
