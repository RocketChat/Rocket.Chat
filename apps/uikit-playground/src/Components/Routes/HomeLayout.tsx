import { Navigate, useOutlet } from 'react-router-dom';

import routes from '../../Routes/Routes';
import { useAuth } from '../../hooks/useAuth';

export const HomeLayout = () => {
  const { user } = useAuth();
  const outlet = useOutlet();

  if (user) {
    return <Navigate to={`${routes.home}`} replace />;
  }

  return <>{outlet}</>;
};
