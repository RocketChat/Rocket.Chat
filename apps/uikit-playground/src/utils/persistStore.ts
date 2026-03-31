import { initialStateType } from '../Context/initialState';

const persistStore = (state: initialStateType) => {
  localStorage.setItem('pesrist', JSON.stringify(state));
};

export default persistStore;
