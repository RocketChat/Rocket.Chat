import {
  ComponentProps,
  Fragment,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { context } from '../../Context';
import persistStore from '../../utils/persistStore';

const PersistStore = (props: ComponentProps<'div'>) => {
  const { state } = useContext(context);

  const handleBeforeUnload = useCallback(() => {
    persistStore(state);
  }, [state]);

  useEffect(() => {
    window.onbeforeunload = handleBeforeUnload;
    return window.removeEventListener('onbeforeunload', handleBeforeUnload);
  }, [handleBeforeUnload, state]);
  return <Fragment {...props} />;
};

export default PersistStore;
