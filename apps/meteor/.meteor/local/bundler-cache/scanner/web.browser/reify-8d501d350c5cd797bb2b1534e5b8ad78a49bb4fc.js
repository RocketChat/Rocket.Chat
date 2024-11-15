let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Button,FieldGroup,Field,FieldLabel,ButtonGroup,PasswordInput,FieldRow,FieldError;module.link('@rocket.chat/fuselage',{Button(v){Button=v},FieldGroup(v){FieldGroup=v},Field(v){Field=v},FieldLabel(v){FieldLabel=v},ButtonGroup(v){ButtonGroup=v},PasswordInput(v){PasswordInput=v},FieldRow(v){FieldRow=v},FieldError(v){FieldError=v}},1);let useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useUniqueId(v){useUniqueId=v}},2);let Form;module.link('@rocket.chat/layout',{Form(v){Form=v}},3);let PasswordVerifier,useValidatePassword;module.link('@rocket.chat/ui-client',{PasswordVerifier(v){PasswordVerifier=v},useValidatePassword(v){useValidatePassword=v}},4);let useSetting,useRouter,useRouteParameter,useUser,useMethod,useTranslation,useLoginWithToken;module.link('@rocket.chat/ui-contexts',{useSetting(v){useSetting=v},useRouter(v){useRouter=v},useRouteParameter(v){useRouteParameter=v},useUser(v){useUser=v},useMethod(v){useMethod=v},useTranslation(v){useTranslation=v},useLoginWithToken(v){useLoginWithToken=v}},5);let useEffect,useRef;module.link('react',{useEffect(v){useEffect=v},useRef(v){useRef=v}},6);let useForm;module.link('react-hook-form',{useForm(v){useForm=v}},7);let HorizontalTemplate;module.link('../template/HorizontalTemplate',{default(v){HorizontalTemplate=v}},8);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};









const getChangePasswordReason = ({ requirePasswordChange, requirePasswordChangeReason = requirePasswordChange ? 'You_need_to_change_your_password' : 'Please_enter_your_new_password_below', } = {}) => requirePasswordChangeReason;
const ResetPasswordPage = () => {
    var _a, _b, _c;
    const user = useUser();
    const t = useTranslation();
    const setUserPassword = useMethod('setUserPassword');
    const resetPassword = useMethod('resetPassword');
    const token = useRouteParameter('token');
    const resetPasswordFormRef = useRef(null);
    const passwordId = useUniqueId();
    const passwordConfirmationId = useUniqueId();
    const passwordVerifierId = useUniqueId();
    const formLabelId = useUniqueId();
    const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation', true);
    const passwordPlaceholder = useSetting('Accounts_PasswordPlaceholder', '');
    const passwordConfirmationPlaceholder = useSetting('Accounts_ConfirmPasswordPlaceholder', '');
    const router = useRouter();
    const changePasswordReason = getChangePasswordReason(user || {});
    const loginWithToken = useLoginWithToken();
    const { register, handleSubmit, setError, formState: { errors, isSubmitting }, watch, } = useForm({
        mode: 'onBlur',
    });
    const password = watch('password');
    const passwordIsValid = useValidatePassword(password);
    useEffect(() => {
        if (resetPasswordFormRef.current) {
            resetPasswordFormRef.current.focus();
        }
    }, []);
    const handleResetPassword = (_a) => __awaiter(void 0, [_a], void 0, function* ({ password }) {
        try {
            if (token) {
                const result = yield resetPassword(token, password);
                yield loginWithToken(result.token);
                router.navigate('/home');
            }
            else {
                yield setUserPassword(password);
            }
        }
        catch ({ error, reason }) {
            const _error = reason !== null && reason !== void 0 ? reason : error;
            setError('password', { message: String(_error) });
        }
    });
    return (_jsx(HorizontalTemplate, { children: _jsxs(Form, { tabIndex: -1, ref: resetPasswordFormRef, "aria-labelledby": formLabelId, "aria-describedby": 'welcomeTitle', onSubmit: handleSubmit(handleResetPassword), children: [_jsxs(Form.Header, { children: [_jsx(Form.Title, { id: formLabelId, children: t('Reset_password') }), _jsx(Form.Subtitle, { children: t(changePasswordReason) })] }), _jsx(Form.Container, { children: _jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, { required: true, htmlFor: passwordId, children: t('registration.component.form.password') }), _jsx(FieldRow, { children: _jsx(PasswordInput, Object.assign({}, register('password', {
                                            required: t('registration.component.form.requiredField'),
                                            validate: () => (!passwordIsValid ? t('Password_must_meet_the_complexity_requirements') : true),
                                        }), { error: (_a = errors === null || errors === void 0 ? void 0 : errors.password) === null || _a === void 0 ? void 0 : _a.message, "aria-invalid": errors.password ? 'true' : 'false', "aria-required": 'true', id: passwordId, placeholder: passwordPlaceholder || t('Create_a_password'), "aria-describedby": `${passwordVerifierId} ${passwordId}-error` })) }), (errors === null || errors === void 0 ? void 0 : errors.password) && (_jsx(FieldError, { "aria-live": 'assertive', id: `${passwordId}-error`, children: errors.password.message })), _jsx(PasswordVerifier, { password: password, id: passwordVerifierId })] }), requiresPasswordConfirmation && (_jsxs(Field, { children: [_jsx(FieldLabel, { required: true, htmlFor: passwordConfirmationId, children: t('registration.component.form.confirmPassword') }), _jsx(FieldRow, { children: _jsx(PasswordInput, Object.assign({}, register('passwordConfirmation', {
                                            required: t('registration.component.form.requiredField'),
                                            deps: ['password'],
                                            validate: (val) => (password === val ? true : t('registration.component.form.invalidConfirmPass')),
                                        }), { error: (_b = errors === null || errors === void 0 ? void 0 : errors.passwordConfirmation) === null || _b === void 0 ? void 0 : _b.message, "aria-required": 'true', "aria-invalid": errors.passwordConfirmation ? 'true' : 'false', "aria-describedby": `${passwordConfirmationId}-error`, id: passwordConfirmationId, placeholder: passwordConfirmationPlaceholder || t('Confirm_password'), disabled: !passwordIsValid })) }), errors.passwordConfirmation && (_jsx(FieldError, { "aria-live": 'assertive', id: `${passwordConfirmationId}-error`, children: (_c = errors.passwordConfirmation) === null || _c === void 0 ? void 0 : _c.message }))] }))] }) }), _jsx(Form.Footer, { children: _jsx(ButtonGroup, { children: _jsx(Button, { primary: true, loading: isSubmitting, type: 'submit', children: t('Reset') }) }) })] }) }));
};
module.exportDefault(ResetPasswordPage);
//# sourceMappingURL=ResetPasswordPage.js.map