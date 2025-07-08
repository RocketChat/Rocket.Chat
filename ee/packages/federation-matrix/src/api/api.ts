import { Router } from '@rocket.chat/http-router';
import { getMatrixInviteRoutes } from './_matrix/invite';

const matrixRoutes = new Router('/_matrix');
const wellknownRoutes = new Router('/.well-known');

export const getAllMatrixRoutes = () => {
    matrixRoutes.use(getMatrixInviteRoutes(matrixRoutes));

    return {
        matrix: matrixRoutes.router,
        wellKnown: wellknownRoutes.router,
    };
}