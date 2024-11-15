module.export({RegistrationPageRouter:function(){return RegistrationPageRouter}},true);var _jsx,_Fragment;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},Fragment:function(v){_Fragment=v}},0);var useSession;module.link('@rocket.chat/ui-contexts',{useSession:function(v){useSession=v}},1);var GuestForm;module.link('./GuestForm',{default:function(v){GuestForm=v}},2);var LoginForm;module.link('./LoginForm',{LoginForm:function(v){LoginForm=v}},3);var RegisterSecretPageRouter;module.link('./RegisterSecretPageRouter',{default:function(v){RegisterSecretPageRouter=v}},4);var RegisterTemplate;module.link('./RegisterTemplate',{default:function(v){RegisterTemplate=v}},5);var ResetPasswordForm;module.link('./ResetPasswordForm',{default:function(v){ResetPasswordForm=v}},6);var useLoginRouter;module.link('./hooks/useLoginRouter',{useLoginRouter:function(v){useLoginRouter=v}},7);







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