import type { ReactElement } from 'react';
import { Modal, Button, Box, Throbber, ProgressBar, Callout } from '@rocket.chat/fuselage';
import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';

type QrModalProps = {
    onClose: () => void;
};

const QrModal = ({ onClose }: QrModalProps): ReactElement => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number>(60);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const generateQrCode = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).slice(2, 15);
            const qrPayload = `login:${timestamp}:${randomId}`;

            const url = await QRCode.toDataURL(qrPayload, {
                width: 256,
                margin: 2,
                color: { dark: '#1f2329', light: '#ffffff' },
                errorCorrectionLevel: 'M',
                type: 'image/png',
            });

            setQrCodeUrl(url);
            setTimeLeft(60);
        } catch (err) {
            console.error('QR generation failed:', err);
            setError('Failed to generate QR code. Please try again.');
            setQrCodeUrl('');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        generateQrCode();
    }, [generateQrCode]);

    useEffect(() => {
        if (timeLeft <= 0) {
            generateQrCode();
            return;
        }
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, generateQrCode]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgressColor = (): 'success' | 'warning' | 'danger' => {
        if (timeLeft > 40) return 'success';
        if (timeLeft > 20) return 'warning';
        return 'danger';
    };

    return (
        <Modal>
            <Modal.Header>
                <Modal.Icon name='mobile-check' size='x20' />
                <Modal.Title>Mobile Authentication</Modal.Title>
                <Modal.Close onClick={onClose} />
            </Modal.Header>

            <Modal.Content>
                <Box
                    display='flex'
                    flexDirection='column'
                    alignItems='center'
                    padding='x24'
                    minHeight='x400'
                >
                    <Box textAlign='center' marginBlockEnd='x32'>
                        <Box fontScale='p1' color='neutral-700' marginBlockEnd='x8'>
                            Scan with your mobile device
                        </Box>
                        <Box fontScale='c1' color='neutral-600'>
                            Open your authenticated mobile app and scan this QR code to sign in
                        </Box>
                    </Box>

                    <Box
                        display='flex'
                        justifyContent='center'
                        alignItems='center'
                        width='x280'
                        height='x280'
                        backgroundColor='white'
                        borderRadius='x8'
                        border='1px solid'
                        borderColor='neutral-300'
                        marginBlockEnd='x24'
                        position='relative'
                        overflow='hidden'
                    >
                        {isLoading ? (
                            <Box display='flex' flexDirection='column' alignItems='center'>
                                <Throbber size='x32' />
                                <Box fontScale='c1' color='neutral-600' marginBlockStart='x16'>
                                    Generating code...
                                </Box>
                            </Box>
                        ) : error ? (
                            <Box display='flex' flexDirection='column' alignItems='center' padding='x16'>
                                <Box fontScale='c1' color='danger-500' textAlign='center' marginBlockEnd='x16'>
                                    {error}
                                </Box>
                                <Button small secondary onClick={generateQrCode}>
                                    Try Again
                                </Button>
                            </Box>
                        ) : qrCodeUrl ? (
                            <>
                                <Box
                                    is='img'
                                    src={qrCodeUrl}
                                    alt='QR code for mobile authentication'
                                    width='x256'
                                    height='x256'
                                />
                                {timeLeft <= 10 && (
                                    <Box
                                        position='absolute'
                                        inset='none'
                                        backgroundColor='danger-500'
                                        opacity={0.1}
                                        borderRadius='x8'
                                    />
                                )}
                            </>
                        ) : null}
                    </Box>

                    <Box width='full' maxWidth='x280' marginBlockEnd='x24'>
                        <Box display='flex' justifyContent='space-between' alignItems='center' marginBlockEnd='x8'>
                            <Box fontScale='c1' color='neutral-600'>
                                Code expires in
                            </Box>
                            <Box
                                fontScale='c1'
                                color={timeLeft <= 20 ? 'danger-500' : 'neutral-700'}
                                fontWeight='bold'
                            >
                                {formatTime(timeLeft)}
                            </Box>
                        </Box>
                        <ProgressBar
                            percentage={(timeLeft / 60) * 100}
                            variant={getProgressColor()}
                        />
                    </Box>

                    <Box display='flex' justifyContent='center' marginInlineEnd='x12'>
                        <Button
                            secondary
                            onClick={generateQrCode}
                            disabled={isLoading}
                            marginInlineEnd={'x8'}
                            title='Generate a new QR code'
                        >
                            Renew Code
                        </Button>
                        <Button
                            primary
                            onClick={onClose}
                            title='Close this dialog'
                        >
                            Close
                        </Button>
                    </Box>

                    <Box textAlign='center' marginBlockStart='x24'>
                        <Box fontScale='c2' color='neutral-500'>
                            Don't have the mobile app? Download it on{' '}
                            <Box
                                is='a'
                                href='https://play.google.com/store/apps/details?id=chat.rocket.android'
                                target='_blank'
                                rel='noopener noreferrer'
                                color='info-600'
                                textDecoration='none'
                                style={{ textDecoration: 'underline' }}
                            >
                                Android
                            </Box>
                            {' '}or{' '}
                            <Box
                                is='a'
                                href='https://apps.apple.com/app/rocket-chat/id1148741252'
                                target='_blank'
                                rel='noopener noreferrer'
                                color='info-600'
                                textDecoration='none'
                                style={{ textDecoration: 'underline' }}
                            >
                                iOS
                            </Box>
                            .
                        </Box>
                    </Box>
                </Box>
            </Modal.Content>
        </Modal>
    );
};

export default QrModal;