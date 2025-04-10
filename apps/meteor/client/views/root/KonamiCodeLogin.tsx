import { useEffect, useRef, useCallback, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

// The classic Konami Code sequence: up, up, down, down, left, right, left, right, b, a
const KONAMI_CODE = [
	'ArrowUp',
	'ArrowUp',
	'ArrowDown',
	'ArrowDown',
	'ArrowLeft',
	'ArrowRight',
	'ArrowLeft',
	'ArrowRight',
	'KeyB',
	'KeyA',
];

const KonamiCodeLogin = () => {
    const isTestMode = process.env.NODE_ENV === 'development';
    
    const [isLoginPage, setIsLoginPage] = useState(false);
    
    useEffect(() => {
        const checkIfLoginPage = () => {
            const path = window.location.pathname;
            setIsLoginPage(path === '/home');
        };
        
        checkIfLoginPage();
        
        const handleLocationChange = () => {
            checkIfLoginPage();
        };
        
        window.addEventListener('popstate', handleLocationChange);
        
        return () => {
            window.removeEventListener('popstate', handleLocationChange);
        };
    }, []);
    
    const isEnabled = isTestMode && isLoginPage;
    
    const keysPressedRef = useRef<string[]>([]);
    const matchedIndexRef = useRef<number>(0);
    
    const dispatchToastMessage = useToastMessageDispatch();
    const { t } = useTranslation();

    const handleKeydown = useCallback((event: KeyboardEvent) => {
        if (!isEnabled) return;
        
        const keyCode = event.code;
        
        const prevKeys = keysPressedRef.current;
        const updatedKeys = [...prevKeys, keyCode].slice(-KONAMI_CODE.length);
        keysPressedRef.current = updatedKeys;
        
        if (keyCode === KONAMI_CODE[matchedIndexRef.current]) {
            matchedIndexRef.current++;
            
            if (matchedIndexRef.current === KONAMI_CODE.length) {
                Meteor.loginWithPassword(
                    'rocketchat.internal.admin.test',
                    'rocketchat.internal.admin.test',
                    (error) => {
                        if (error) {
                            dispatchToastMessage({ type: 'error', message: t('Login_failed') });
                        } else {
                            dispatchToastMessage({ 
                                type: 'success', 
                                message: 'Successfully logged in via Konami code'
                            });
                        }
                    }
                );
                
                matchedIndexRef.current = 0;
            }
        } else if (keyCode === KONAMI_CODE[0]) {
            matchedIndexRef.current = 1;
        } else {
            matchedIndexRef.current = 0;
        }
    }, [dispatchToastMessage, isEnabled, t]);

    useEffect(() => {
        if (!isEnabled) return;
        
        document.addEventListener('keydown', handleKeydown);
        return () => {
            document.removeEventListener('keydown', handleKeydown);
        };
    }, [handleKeydown, isEnabled]);

    return null;
};

export default KonamiCodeLogin;