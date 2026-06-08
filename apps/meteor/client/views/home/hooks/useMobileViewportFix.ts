/**
 * @name useMobileViewportFix
 * @description
 * This hook applies temporary CSS overrides to the Global Navbar (.rcx-navbar)
 * ONLY when the Home Page is active.
 *
 * Why? The global navbar does not collapse gracefully on small screens (<425px),
 * causing horizontal overflow. Since we cannot modify the global core component
 * without risking side effects in other views, we patch it locally here.
 */
import { useEffect } from 'react';

export const useMobileViewportFix = (): void => {
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'mobile-viewport-fix';
        style.innerHTML = `
            @media (max-width: 425px) {
                .rcx-navbar::-webkit-scrollbar {
                    width: 0px !important;
                    height: 0px !important;
                    background: transparent !important;
                }
                .rcx-navbar::-webkit-scrollbar-track {
                    background: transparent !important;
                }
                .rcx-navbar::-webkit-scrollbar-thumb {
                    background: transparent !important;
                }
                .rcx-navbar {
                    width: 100% !important;
                    overflow-x: hidden !important;
                    overflow-y: hidden !important;
                    padding-left: 4px !important;
                    padding-right: 4px !important;
                    gap: 0 !important;
                    border-right: none !important;
                    box-shadow: none !important;
                }
                .rcx-navbar hr,
                .rcx-navbar .rcx-divider,
                .rcx-navbar .rcx-navbar-divider {
                    display: none !important;
                }
                .rcx-navbar button.rcx-button--icon {
                    width: 28px !important;
                    min-width: 28px !important;
                    height: 28px !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                .rcx-navbar button.rcx-button--icon .rcx-icon {
                    font-size: 1.25rem !important;
                }
                .rcx-navbar .rcx-input-box__wrapper {
                    display: flex !important;
                    align-items: center !important;
                    position: relative !important;
                    height: 28px !important;
                    flex-grow: 1 !important;
                    flex-shrink: 1 !important;
                    min-width: 40px !important;
                    margin: 0 4px !important;
                }
                .rcx-navbar input[type="text"] {
                    height: 28px !important;
                    width: 100% !important;
                    min-width: 0 !important;
                    padding-left: 28px !important;
                    padding-right: 4px !important;
                }
                .rcx-navbar .rcx-input-box__addon {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    bottom: 0 !important;
                    width: 28px !important;
                    height: 28px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    pointer-events: none;
                    z-index: 10;
                }
                .rcx-navbar .rcx-avatar, 
                .rcx-navbar .rcx-avatar__element {
                    width: 26px !important;
                    height: 26px !important;
                }
            }
        `;

        document.head.appendChild(style);

        return () => {
            const existingStyle = document.getElementById('mobile-viewport-fix');
            if (existingStyle) {
                existingStyle.remove();
            }
        };
    }, []);
};