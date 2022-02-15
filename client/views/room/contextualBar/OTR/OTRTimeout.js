import React from 'react';
import VerticalBar from '../../../../components/VerticalBar';
import { Box, Button, ButtonGroup, Tile } from '@rocket.chat/fuselage';
import { useTranslation } from '../../../../contexts/TranslationContext';

export default function OTRTimeout() {
    const t = useTranslation();
    
    return (
        <VerticalBar.ScrollableContent p='x24' height='100%' display="flex" justifyContent='center' alignItems='center'>
        <VerticalBar.Content>
            <Tile className='icon-tile' height={60} width={60} border='none' borderRadius={100} backgroundColor='#EEEFF1' display="flex" justifyContent='center' alignItems='center' alignSelf='center'>
            <VerticalBar.Icon name='clock' />
            </Tile>
            <Box textAlign='center' color='#2F343D' fontScale='h2'>{t('OTR chat invite expired')}</Box>
            <Box textAlign='center' color="#6C727A" fontScale='p4m'>{t('{Username} failed to accept OTR chat invite in time. For privacy protection local cache was deleted, including all related system messages.')}</Box>
            <ButtonGroup   align='center'>
                <Button primary>New OTR chat</Button>
            </ButtonGroup>
        </VerticalBar.Content>
        </VerticalBar.ScrollableContent>
    )
}
