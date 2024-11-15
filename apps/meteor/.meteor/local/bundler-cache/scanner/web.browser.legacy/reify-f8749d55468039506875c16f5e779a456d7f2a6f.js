module.export({RegisterForm:function(){return RegisterForm}},true);var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var FieldGroup,TextInput,Field,FieldLabel,FieldRow,FieldError,PasswordInput,ButtonGroup,Button,TextAreaInput,Callout;module.link('@rocket.chat/fuselage',{FieldGroup:function(v){FieldGroup=v},TextInput:function(v){TextInput=v},Field:function(v){Field=v},FieldLabel:function(v){FieldLabel=v},FieldRow:function(v){FieldRow=v},FieldError:function(v){FieldError=v},PasswordInput:function(v){PasswordInput=v},ButtonGroup:function(v){ButtonGroup=v},Button:function(v){Button=v},TextAreaInput:function(v){TextAreaInput=v},Callout:function(v){Callout=v}},1);var useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useUniqueId:function(v){useUniqueId=v}},2);var Form,ActionLink;module.link('@rocket.chat/layout',{Form:function(v){Form=v},ActionLink:function(v){ActionLink=v}},3);var CustomFieldsForm,PasswordVerifier,useValidatePassword;module.link('@rocket.chat/ui-client',{CustomFieldsForm:function(v){CustomFieldsForm=v},PasswordVerifier:function(v){PasswordVerifier=v},useValidatePassword:function(v){useValidatePassword=v}},4);var useAccountsCustomFields,useSetting,useToastMessageDispatch;module.link('@rocket.chat/ui-contexts',{useAccountsCustomFields:function(v){useAccountsCustomFields=v},useSetting:function(v){useSetting=v},useToastMessageDispatch:function(v){useToastMessageDispatch=v}},5);var useEffect,useRef,useState;module.link('react',{useEffect:function(v){useEffect=v},useRef:function(v){useRef=v},useState:function(v){useState=v}},6);var useForm;module.link('react-hook-form',{useForm:function(v){useForm=v}},7);var Trans,useTranslation;module.link('react-i18next',{Trans:function(v){Trans=v},useTranslation:function(v){useTranslation=v}},8);var EmailConfirmationForm;module.link('./EmailConfirmationForm',{default:function(v){EmailConfirmationForm=v}},9);var useRegisterMethod;module.link('./hooks/useRegisterMethod',{useRegisterMethod:function(v){useRegisterMethod=v}},10);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};

/* eslint-disable complexity */










const RegisterForm = ({ setLoginRoute }) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const { t } = useTranslation();
    const requireNameForRegister = Boolean(useSetting('Accounts_RequireNameForSignUp'));
    const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation');
    const manuallyApproveNewUsersRequired = useSetting('Accounts_ManuallyApproveNewUsers');
    const usernameOrEmailPlaceholder = String(useSetting('Accounts_EmailOrUsernamePlaceholder'));
    const passwordPlaceholder = String(useSetting('Accounts_PasswordPlaceholder'));
    const passwordConfirmationPlaceholder = String(useSetting('Accounts_ConfirmPasswordPlaceholder'));
    const formLabelId = useUniqueId();
    const passwordVerifierId = useUniqueId();
    const nameId = useUniqueId();
    const emailId = useUniqueId();
    const usernameId = useUniqueId();
    const passwordId = useUniqueId();
    const passwordConfirmationId = useUniqueId();
    const reasonId = useUniqueId();
    const registerUser = useRegisterMethod();
    const customFields = useAccountsCustomFields();
    const [serverError, setServerError] = useState(undefined);
    const dispatchToastMessage = useToastMessageDispatch();
    const { register, handleSubmit, setError, watch, getValues, clearErrors, control, formState: { errors }, } = useForm({ mode: 'onBlur' });
    const { password } = watch();
    const passwordIsValid = useValidatePassword(password);
    const registerFormRef = useRef(null);
    useEffect(() => {
        if (registerFormRef.current) {
            registerFormRef.current.focus();
        }
    }, []);
    const handleRegister = (_a) => __awaiter(void 0, void 0, void 0, function* () {
        var { password, passwordConfirmation: _ } = _a, formData = __rest(_a, ["password", "passwordConfirmation"]);
        registerUser.mutate(Object.assign({ pass: password }, formData), {
            onError: (error) => {
                if ([error.error, error.errorType].includes('error-invalid-email')) {
                    setError('email', { type: 'invalid-email', message: t('registration.component.form.invalidEmail') });
                }
                if (error.errorType === 'error-user-already-exists') {
                    setError('username', { type: 'user-already-exists', message: t('registration.component.form.usernameAlreadyExists') });
                }
                if (/Email already exists/.test(error.error)) {
                    setError('email', { type: 'email-already-exists', message: t('registration.component.form.emailAlreadyExists') });
                }
                if (/Username is already in use/.test(error.error)) {
                    setError('username', { type: 'username-already-exists', message: t('registration.component.form.userAlreadyExist') });
                }
                if (/The username provided is not valid/.test(error.error)) {
                    setError('username', {
                        type: 'username-contains-invalid-chars',
                        message: t('registration.component.form.usernameContainsInvalidChars'),
                    });
                }
                if (/Name contains invalid characters/.test(error.error)) {
                    setError('name', { type: 'name-contains-invalid-chars', message: t('registration.component.form.nameContainsInvalidChars') });
                }
                if (/error-too-many-requests/.test(error.error)) {
                    dispatchToastMessage({ type: 'error', message: error.error });
                }
                if (/error-user-is-not-activated/.test(error.error)) {
                    dispatchToastMessage({ type: 'info', message: t('registration.page.registration.waitActivationWarning') });
                    setLoginRoute('login');
                }
                if (error.error === 'error-user-registration-custom-field') {
                    setServerError(error.message);
                }
            },
        });
    });
    if (((_a = errors.email) === null || _a === void 0 ? void 0 : _a.type) === 'invalid-email') {
        return _jsx(EmailConfirmationForm, { onBackToLogin: () => clearErrors('email'), email: getValues('email') });
    }
    return (_jsxs(Form, { tabIndex: -1, ref: registerFormRef, "aria-labelledby": formLabelId, "aria-describedby": 'welcomeTitle', onSubmit: handleSubmit(handleRegister), children: [_jsx(Form.Header, { children: _jsx(Form.Title, { id: formLabelId, children: t('registration.component.form.createAnAccount') }) }), _jsx(Form.Container, { children: _jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, { required: requireNameForRegister, htmlFor: nameId, children: t('registration.component.form.name') }), _jsx(FieldRow, { children: _jsx(TextInput, Object.assign({}, register('name', {
                                        required: requireNameForRegister ? t('Required_field', { field: t('registration.component.form.name') }) : false,
                                    }), { error: (_b = errors === null || errors === void 0 ? void 0 : errors.name) === null || _b === void 0 ? void 0 : _b.message, "aria-required": requireNameForRegister, "aria-invalid": errors.name ? 'true' : 'false', placeholder: t('onboarding.form.adminInfoForm.fields.fullName.placeholder'), "aria-describedby": `${nameId}-error`, id: nameId })) }), errors.name && (_jsx(FieldError, { "aria-live": 'assertive', id: `${nameId}-error`, children: errors.name.message }))] }), _jsxs(Field, { children: [_jsx(FieldLabel, { required: true, htmlFor: emailId, children: t('registration.component.form.email') }), _jsx(FieldRow, { children: _jsx(TextInput, Object.assign({}, register('email', {
                                        required: t('Required_field', { field: t('registration.component.form.email') }),
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: t('registration.component.form.invalidEmail'),
                                        },
                                    }), { placeholder: usernameOrEmailPlaceholder || t('registration.component.form.emailPlaceholder'), error: (_c = errors === null || errors === void 0 ? void 0 : errors.email) === null || _c === void 0 ? void 0 : _c.message, "aria-required": 'true', "aria-invalid": errors.email ? 'true' : 'false', "aria-describedby": `${emailId}-error`, id: emailId })) }), errors.email && (_jsx(FieldError, { "aria-live": 'assertive', id: `${emailId}-error`, children: errors.email.message }))] }), _jsxs(Field, { children: [_jsx(FieldLabel, { required: true, htmlFor: usernameId, children: t('registration.component.form.username') }), _jsx(FieldRow, { children: _jsx(TextInput, Object.assign({}, register('username', {
                                        required: t('Required_field', { field: t('registration.component.form.username') }),
                                    }), { error: (_d = errors === null || errors === void 0 ? void 0 : errors.username) === null || _d === void 0 ? void 0 : _d.message, "aria-required": 'true', "aria-invalid": errors.username ? 'true' : 'false', "aria-describedby": `${usernameId}-error`, id: usernameId, placeholder: 'jon.doe' })) }), errors.username && (_jsx(FieldError, { "aria-live": 'assertive', id: `${usernameId}-error`, children: errors.username.message }))] }), _jsxs(Field, { children: [_jsx(FieldLabel, { required: true, htmlFor: passwordId, children: t('registration.component.form.password') }), _jsx(FieldRow, { children: _jsx(PasswordInput, Object.assign({}, register('password', {
                                        required: t('Required_field', { field: t('registration.component.form.password') }),
                                        validate: () => (!passwordIsValid ? t('Password_must_meet_the_complexity_requirements') : true),
                                    }), { error: (_e = errors.password) === null || _e === void 0 ? void 0 : _e.message, "aria-required": 'true', "aria-invalid": errors.password ? 'true' : undefined, id: passwordId, placeholder: passwordPlaceholder || t('Create_a_password'), "aria-describedby": `${passwordVerifierId} ${passwordId}-error` })) }), (errors === null || errors === void 0 ? void 0 : errors.password) && (_jsx(FieldError, { "aria-live": 'assertive', id: `${passwordId}-error`, children: errors.password.message })), _jsx(PasswordVerifier, { password: password, id: passwordVerifierId })] }), requiresPasswordConfirmation && (_jsxs(Field, { children: [_jsx(FieldLabel, { required: true, htmlFor: passwordConfirmationId, children: t('registration.component.form.confirmPassword') }), _jsx(FieldRow, { children: _jsx(PasswordInput, Object.assign({}, register('passwordConfirmation', {
                                        required: t('Required_field', { field: t('registration.component.form.confirmPassword') }),
                                        deps: ['password'],
                                        validate: (val) => (watch('password') === val ? true : t('registration.component.form.invalidConfirmPass')),
                                    }), { error: (_f = errors.passwordConfirmation) === null || _f === void 0 ? void 0 : _f.message, "aria-required": 'true', "aria-invalid": errors.passwordConfirmation ? 'true' : 'false', id: passwordConfirmationId, "aria-describedby": `${passwordConfirmationId}-error`, placeholder: passwordConfirmationPlaceholder || t('Confirm_password'), disabled: !passwordIsValid })) }), errors.passwordConfirmation && (_jsx(FieldError, { "aria-live": 'assertive', id: `${passwordConfirmationId}-error`, children: errors.passwordConfirmation.message }))] })), manuallyApproveNewUsersRequired && (_jsxs(Field, { children: [_jsx(FieldLabel, { required: true, htmlFor: reasonId, children: t('registration.component.form.reasonToJoin') }), _jsx(FieldRow, { children: _jsx(TextAreaInput, Object.assign({}, register('reason', {
                                        required: t('Required_field', { field: t('registration.component.form.reasonToJoin') }),
                                    }), { error: (_g = errors === null || errors === void 0 ? void 0 : errors.reason) === null || _g === void 0 ? void 0 : _g.message, "aria-required": 'true', "aria-invalid": errors.reason ? 'true' : 'false', "aria-describedby": `${reasonId}-error`, id: reasonId })) }), errors.reason && (_jsx(FieldError, { "aria-live": 'assertive', id: `${reasonId}-error`, children: errors.reason.message }))] })), _jsx(CustomFieldsForm, { formName: 'customFields', formControl: control, metadata: customFields }), serverError && _jsx(Callout, { type: 'danger', children: serverError })] }) }), _jsxs(Form.Footer, { children: [_jsx(ButtonGroup, { children: _jsx(Button, { type: 'submit', loading: registerUser.isLoading, primary: true, children: t('registration.component.form.joinYourTeam') }) }), _jsx(ActionLink, { onClick: () => {
                            setLoginRoute('login');
                        }, children: _jsx(Trans, { i18nKey: 'registration.page.register.back', children: "Back to Login" }) })] })] }));
};
module.exportDefault(RegisterForm);
//# sourceMappingURL=RegisterForm.js.map