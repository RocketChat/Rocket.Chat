import type { ReactElement } from 'react';
import { Modal, Button, Box, Throbber, ProgressBar } from '@rocket.chat/fuselage';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQrCodeQueryHandler } from './hooks/useQrCodeQueryHandler';

type QrModalProps = {
    onClose: () => void;
};

const QrModal = ({ onClose }: QrModalProps): ReactElement => {
    const [timeLeft, setTimeLeft] = useState<number>(60);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const {
        data: qrCodeUrl,
        isLoading,
        error,
        refetch
    } = useQrCodeQueryHandler();

    const generateQrCode = useCallback(async () => {
        setTimeLeft(60);
        await refetch();
    }, [refetch]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (timeLeft <= 0) {
            generateQrCode();
            return;
        }

        timerRef.current = setTimeout(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
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

    const handleRenewCode = useCallback(() => {
        generateQrCode();
    }, [generateQrCode]);

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
                                    Failed to generate QR code. Please try again.
                                </Box>
                                <Button small secondary onClick={handleRenewCode}>
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
                            onClick={handleRenewCode}
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