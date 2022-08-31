import { useState, Dispatch } from 'react';

type LoginRoutes = 'login' | 'reset-password' | 'register' | 'wait-activation' | 'wait-email-activation' | 'email-verification';

export const useLoginRouter = (route: LoginRoutes): [LoginRoutes, DispatchLoginRouter] => useState<LoginRoutes>(route);

export type DispatchLoginRouter = Dispatch<LoginRoutes>;
