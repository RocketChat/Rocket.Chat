import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export const GenericCardButton = (props: ComponentProps<typeof Button>) => <Button {...props} medium />;
