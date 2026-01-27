import CMSPage from './CMSPage';
import RegistrationPageRouter from './RegistrationPageRouter';
import ResetPasswordPage from './ResetPassword/ResetPasswordPage';

export type { LoginRoutes } from './hooks/useLoginRouter';
export { CMSPage, ResetPasswordPage };
export { default as PhoneNumberInput } from './components/PhoneNumberInput/PhoneNumberInput';

export default RegistrationPageRouter;
