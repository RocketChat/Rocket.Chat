import type { Dispatch } from 'react';
import { useState } from 'react';

type LoginRoutes = 'login' | 'reset-password' | 'register' | 'register-invalid' | 'secret-register';

export const useLoginRouter = (route: LoginRoutes): [LoginRoutes, DispatchLoginRouter] => useState<LoginRoutes>(route);

export type DispatchLoginRouter = Dispatch<LoginRoutes>;
