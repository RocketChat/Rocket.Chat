import { ContextualbarV2Title } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type ContextualbarTitleProps = ComponentProps<typeof ContextualbarV2Title>;

const ContextualbarTitle = (props: ContextualbarTitleProps) => <ContextualbarV2Title id='contextualbarTitle' {...props} />;

export default ContextualbarTitle;
