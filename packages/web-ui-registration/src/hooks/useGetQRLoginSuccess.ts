// import { useStream } from '@rocket.chat/ui-contexts';
// import { useEffect } from 'react';

// export const useGetQRLoginSuccess = (userId: string) => {
//     const getNotifyUserStream = useStream('qr-code');

//     useEffect(() => {
//         setForceLogout(false);

//         const unsubscribe = getNotifyUserStream(`qr-code`, () => {
//             console.log('QR code login successful');
//         });

//         return unsubscribe;
//     }, [getNotifyUserStream, setForceLogout, userId]);
// };
