import type { ButtonProps } from '@rocket.chat/fuselage';
import { Button } from '@rocket.chat/fuselage';

export type GenericCardButtonProps = ButtonProps;

export const GenericCardButton = (props: GenericCardButtonProps) => <Button {...props} medium />;
