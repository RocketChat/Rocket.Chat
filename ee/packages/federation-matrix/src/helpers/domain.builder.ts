import { Settings } from '@rocket.chat/models';

export const getMatrixLocalDomain = async () => {
    const port = await Settings.findOneById('Federation_Service_Matrix_Port');
    const domain = await Settings.findOneById('Federation_Service_Matrix_Domain');
    if (!port || !domain) {
        throw new Error('Matrix domain or port not found');
    }

    const matrixDomain = port.value === 443 || port.value === 80 ? domain.value : `${domain.value}:${port.value}`;

    return String(matrixDomain);
}