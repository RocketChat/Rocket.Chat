module.export({RegistrationPageRouter:()=>RegistrationPageRouter},true);let _jsx,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},Fragment(v){_Fragment=v}},0);let useSession;module.link('@rocket.chat/ui-contexts',{useSession(v){useSession=v}},1);let GuestForm;module.link('./GuestForm',{default(v){GuestForm=v}},2);let LoginForm;module.link('./LoginForm',{LoginForm(v){LoginForm=v}},3);let RegisterSecretPageRouter;module.link('./RegisterSecretPageRouter',{default(v){RegisterSecretPageRouter=v}},4);let RegisterTemplate;module.link('./RegisterTemplate',{default(v){RegisterTemplate=v}},5);let ResetPasswordForm;module.link('./ResetPasswordForm',{default(v){ResetPasswordForm=v}},6);let useLoginRouter;module.link('./hooks/useLoginRouter',{useLoginRouter(v){useLoginRouter=v}},7);







const RegistrationPageRouter = ({ defaultRoute = 'login', children, }) => {
    const defaultRouteSession = useSession('loginDefaultState');
    const [route, setLoginRoute] = useLoginRouter(defaultRouteSession || defaultRoute);
    if (route === 'guest') {
        return (_jsx(RegisterTemplate, { children: _jsx(GuestForm, { setLoginRoute: setLoginRoute }) }));
    }
    if (route === 'login') {
        return (_jsx(RegisterTemplate, { children: _jsx(LoginForm, { setLoginRoute: setLoginRoute }) }));
    }
    if (route === 'reset-password') {
        return (_jsx(RegisterTemplate, { children: _jsx(ResetPasswordForm, { setLoginRoute: setLoginRoute }) }));
    }
    if (route === 'secret-register' || route === 'register' || route === 'invite-register') {
        return _jsx(RegisterSecretPageRouter, { origin: route, setLoginRoute: setLoginRoute });
    }
    if (route === 'anonymous') {
        return _jsx(_Fragment, { children: children });
    }
    return null;
};
module.exportDefault(RegistrationPageRouter);
//# sourceMappingURL=RegistrationPageRouter.js.map