import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type GenericCardButtonProps = ComponentProps<typeof Button>;

export const GenericCardButton = (props: GenericCardButtonProps) => <Button {...props} medium />;
