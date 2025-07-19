export type QRCodeEndpoint = {
    '/v1/qrcode.generate': {
        POST: (params: { sessionId: string }) => string;
    };
    '/v1/qrcode.verify':{
        POST: (params: { code: string }) => { success: boolean; message?: string };
    }
};
