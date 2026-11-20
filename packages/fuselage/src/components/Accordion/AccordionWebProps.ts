import type { AccordionItemContract } from './Accordion.contract';
import type { WebProps } from '../../types/WebAttributes';

// Kept out of the frame modules: they name no DOM type
export type AccordionItemWebProps = WebProps<AccordionItemContract, HTMLElement>;
