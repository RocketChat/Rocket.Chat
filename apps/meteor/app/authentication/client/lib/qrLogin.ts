import { Meteor } from 'meteor/meteor';

// 1. Create streamer instance
const qrStreamer = new Meteor.Streamer('qr-login');

// 2. Main function
export function watchQrLogin(token: string, callbacks: {
    onScan: (userId: string) => void;
    onError: (error: Error) => void;
}) {
    // ... existing implementation ...
}

// 3. Debug initialization with retry mechanism
function initializeDebugTools() {
    if (!Meteor.isClient || !Meteor.isDevelopment) return;

    const maxAttempts = 10;
    let attempts = 0;

    const tryInitialize = () => {
        attempts++;
        if (typeof (window as any).__qrDebug === 'undefined') {
            (window as any).__qrDebug = {
                watchQrLogin,
                qrStreamer,
                test: (token: string) => {
                    console.log('[QR-DEBUG] Testing token:', token);
                    return watchQrLogin(token, {
                        onScan: (userId) => console.log('[QR-DEBUG] Scanned by:', userId),
                        onError: (err) => console.error('[QR-DEBUG] Error:', err)
                    });
                }
            };
            console.log('[QR-DEBUG] Tools initialized successfully');
        } else if (attempts < maxAttempts) {
            setTimeout(tryInitialize, 500);
        } else {
            console.error('[QR-DEBUG] Failed to initialize after', maxAttempts, 'attempts');
        }
    };

    Meteor.startup(() => {
        tryInitialize();
    });
}

initializeDebugTools();