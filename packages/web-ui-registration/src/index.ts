import CMSPage from './CMSPage';
import RegisterForm from './RegisterForm';
import RegisterTemplate from './RegisterTemplate';
import RegistrationPageRouter from './RegistrationPageRouter';
import ResetPasswordPage from './ResetPassword/ResetPasswordPage';

export type { LoginRoutes } from './hooks/useLoginRouter';
export { CMSPage, ResetPasswordPage, RegisterForm, RegisterTemplate };
export { default as PhoneNumberInput } from './components/PhoneNumberInput/PhoneNumberInput';

export default RegistrationPageRouter;
