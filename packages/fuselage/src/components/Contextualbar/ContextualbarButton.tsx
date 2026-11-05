import { memo } from 'react';

import { Button, type ButtonProps } from '../Button';

export type ContextualbarButtonProps = ButtonProps;

const ContextualbarButton = (props: ContextualbarButtonProps) => <Button {...props} />;

export default memo(ContextualbarButton);
