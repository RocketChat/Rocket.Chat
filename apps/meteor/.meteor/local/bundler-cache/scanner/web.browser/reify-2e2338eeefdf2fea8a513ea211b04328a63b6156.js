module.export({LoginForm:()=>LoginForm},true);let _jsx,_jsxs,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v},Fragment(v){_Fragment=v}},0);let FieldGroup,TextInput,Field,FieldLabel,FieldRow,FieldError,FieldLink,PasswordInput,ButtonGroup,Button,Callout;module.link('@rocket.chat/fuselage',{FieldGroup(v){FieldGroup=v},TextInput(v){TextInput=v},Field(v){Field=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},FieldError(v){FieldError=v},FieldLink(v){FieldLink=v},PasswordInput(v){PasswordInput=v},ButtonGroup(v){ButtonGroup=v},Button(v){Button=v},Callout(v){Callout=v}},1);let useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useUniqueId(v){useUniqueId=v}},2);let Form,ActionLink;module.link('@rocket.chat/layout',{Form(v){Form=v},ActionLink(v){ActionLink=v}},3);let useDocumentTitle;module.link('@rocket.chat/ui-client',{useDocumentTitle(v){useDocumentTitle=v}},4);let useLoginWithPassword,useSetting;module.link('@rocket.chat/ui-contexts',{useLoginWithPassword(v){useLoginWithPassword=v},useSetting(v){useSetting=v}},5);let useMutation;module.link('@tanstack/react-query',{useMutation(v){useMutation=v}},6);let useEffect,useRef,useState;module.link('react',{useEffect(v){useEffect=v},useRef(v){useRef=v},useState(v){useState=v}},7);let useForm;module.link('react-hook-form',{useForm(v){useForm=v}},8);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},9);let EmailConfirmationForm;module.link('./EmailConfirmationForm',{default(v){EmailConfirmationForm=v}},10);let LoginServices;module.link('./LoginServices',{default(v){LoginServices=v}},11);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};












const LOGIN_SUBMIT_ERRORS = {
    'error-user-is-not-activated': {
        type: 'warning',
        i18n: 'registration.page.registration.waitActivationWarning',
    },
    'error-app-user-is-not-allowed-to-login': {
        type: 'danger',
        i18n: 'registration.page.login.errors.AppUserNotAllowedToLogin',
    },
    'user-not-found': {
        type: 'danger',
        i18n: 'registration.page.login.errors.wrongCredentials',
    },
    'error-login-blocked-for-ip': {
        type: 'danger',
        i18n: 'registration.page.login.errors.loginBlockedForIp',
    },
    'error-login-blocked-for-user': {
        type: 'danger',
        i18n: 'registration.page.login.errors.loginBlockedForUser',
    },
    'error-license-user-limit-reached': {
        type: 'warning',
        i18n: 'registration.page.login.errors.licenseUserLimitReached',
    },
    'error-invalid-email': {
        type: 'danger',
        i18n: 'registration.page.login.errors.invalidEmail',
    },
};
const LoginForm = ({ setLoginRoute }) => {
    var _a, _b, _c;
    const { register, handleSubmit, setError, clearErrors, getValues, formState: { errors }, } = useForm({
        mode: 'onBlur',
    });
    const { t } = useTranslation();
    const formLabelId = useUniqueId();
    const [errorOnSubmit, setErrorOnSubmit] = useState(undefined);
    const isResetPasswordAllowed = useSetting('Accounts_PasswordReset');
    const login = useLoginWithPassword();
    const showFormLogin = useSetting('Accounts_ShowFormLogin');
    const usernameOrEmailPlaceholder = String(useSetting('Accounts_EmailOrUsernamePlaceholder'));
    const passwordPlaceholder = String(useSetting('Accounts_PasswordPlaceholder'));
    useDocumentTitle(t('registration.component.login'), false);
    const loginMutation = useMutation({
        mutationFn: (formData) => {
            return login(formData.usernameOrEmail, formData.password);
        },
        onError: (error) => {
            if ([error.error, error.errorType].includes('error-invalid-email')) {
                setError('usernameOrEmail', { type: 'invalid-email', message: t('registration.page.login.errors.invalidEmail') });
            }
            if ('error' in error && error.error !== 403) {
                setErrorOnSubmit([error.error, error.reason]);
                return;
            }
            setErrorOnSubmit(['user-not-found']);
        },
    });
    const usernameId = useUniqueId();
    const passwordId = useUniqueId();
    const loginFormRef = useRef(null);
    useEffect(() => {
        if (loginFormRef.current) {
            loginFormRef.current.focus();
        }
    }, [errorOnSubmit]);
    const renderErrorOnSubmit = ([error, message]) => {
        if (error in LOGIN_SUBMIT_ERRORS) {
            const { type, i18n } = LOGIN_SUBMIT_ERRORS[error];
            return (_jsx(Callout, { id: `${usernameId}-error`, "aria-live": 'assertive', type: type, children: t(i18n) }));
        }
        if (error === 'totp-canceled') {
            return null;
        }
        if (message) {
            return (_jsx(Callout, { id: `${usernameId}-error`, "aria-live": 'assertive', type: 'danger', children: message }));
        }
        return null;
    };
    if (((_a = errors.usernameOrEmail) === null || _a === void 0 ? void 0 : _a.type) === 'invalid-email') {
        return _jsx(EmailConfirmationForm, { onBackToLogin: () => clearErrors('usernameOrEmail'), email: getValues('usernameOrEmail') });
    }
    return (_jsxs(Form, { tabIndex: -1, ref: loginFormRef, "aria-labelledby": formLabelId, "aria-describedby": 'welcomeTitle', onSubmit: handleSubmit((data) => __awaiter(void 0, void 0, void 0, function* () { return loginMutation.mutate(data); })), children: [_jsx(Form.Header, { children: _jsx(Form.Title, { id: formLabelId, children: t('registration.component.login') }) }), showFormLogin && (_jsxs(_Fragment, { children: [_jsxs(Form.Container, { children: [_jsxs(FieldGroup, { disabled: loginMutation.isLoading, children: [_jsxs(Field, { children: [_jsx(FieldLabel, { required: true, htmlFor: usernameId, children: t('registration.component.form.emailOrUsername') }), _jsx(FieldRow, { children: _jsx(TextInput, Object.assign({}, register('usernameOrEmail', {
                                                    required: t('Required_field', { field: t('registration.component.form.emailOrUsername') }),
                                                }), { placeholder: usernameOrEmailPlaceholder || t('registration.component.form.emailPlaceholder'), error: (_b = errors.usernameOrEmail) === null || _b === void 0 ? void 0 : _b.message, "aria-invalid": errors.usernameOrEmail || errorOnSubmit ? 'true' : 'false', "aria-describedby": `${usernameId}-error`, id: usernameId })) }), errors.usernameOrEmail && (_jsx(FieldError, { "aria-live": 'assertive', id: `${usernameId}-error`, children: errors.usernameOrEmail.message }))] }), _jsxs(Field, { children: [_jsx(FieldLabel, { required: true, htmlFor: passwordId, children: t('registration.component.form.password') }), _jsx(FieldRow, { children: _jsx(PasswordInput, Object.assign({}, register('password', {
                                                    required: t('Required_field', { field: t('registration.component.form.password') }),
                                                }), { placeholder: passwordPlaceholder, error: (_c = errors.password) === null || _c === void 0 ? void 0 : _c.message, "aria-invalid": errors.password || errorOnSubmit ? 'true' : 'false', "aria-describedby": `${passwordId}-error`, id: passwordId })) }), errors.password && (_jsx(FieldError, { "aria-live": 'assertive', id: `${passwordId}-error`, children: errors.password.message })), isResetPasswordAllowed && (_jsx(FieldRow, { justifyContent: 'end', children: _jsx(FieldLink, { href: '#', onClick: (e) => {
                                                        e.preventDefault();
                                                        setLoginRoute('reset-password');
                                                    }, children: _jsx(Trans, { i18nKey: 'registration.page.login.forgot', children: "Forgot your password?" }) }) }))] })] }), errorOnSubmit && _jsx(FieldGroup, { disabled: loginMutation.isLoading, children: renderErrorOnSubmit(errorOnSubmit) })] }), _jsxs(Form.Footer, { children: [_jsx(ButtonGroup, { children: _jsx(Button, { loading: loginMutation.isLoading, type: 'submit', primary: true, children: t('registration.component.login') }) }), _jsx("p", { children: _jsxs(Trans, { i18nKey: 'registration.page.login.register', children: ["New here? ", _jsx(ActionLink, { onClick: () => setLoginRoute('register'), children: "Create an account" })] }) })] })] })), _jsx(LoginServices, { disabled: loginMutation.isLoading, setError: setErrorOnSubmit })] }));
};
module.exportDefault(LoginForm);
//# sourceMappingURL=LoginForm.js.map