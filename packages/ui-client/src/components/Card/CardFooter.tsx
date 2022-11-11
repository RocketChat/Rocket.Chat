import { ButtonGroup } from '@rocket.chat/fuselage';
import type { FC } from 'react';

const CardFooter: FC = ({ children }) => <ButtonGroup medium>{children}</ButtonGroup>;

export default CardFooter;
