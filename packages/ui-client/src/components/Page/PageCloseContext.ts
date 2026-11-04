import { createContext } from 'react';

/**
 * Set when a page is shown in a modal: its header then gets a close button, so a full page can be reused there as it
 * is.
 */
const PageCloseContext = createContext<(() => void) | undefined>(undefined);

export default PageCloseContext;
