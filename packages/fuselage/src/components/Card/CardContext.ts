import { createContext } from 'react';

/** Whether the `Card` that holds a part is laid out horizontally, which its columns space their rows by. */
export const CardContext = createContext<{ horizontal: boolean }>({ horizontal: false });

const horizontalCard = { horizontal: true };
const verticalCard = { horizontal: false };

export const cardValue = (horizontal: boolean) => (horizontal ? horizontalCard : verticalCard);
