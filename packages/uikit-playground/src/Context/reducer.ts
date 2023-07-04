import type { DocAction } from './action/docAction';
import type { initialStateType } from './initialState';

type ActionType =
  | DocAction
  | { type: 'navMenuToogle' | 'surface' | 'editorToggle'; payload: number }
  | { type: 'isMobile' | 'isTablet' | 'sidebarToggle' | 'navMenuToggle'; payload: boolean }

const reducer = (state: initialStateType, action: ActionType) => {
  switch (action.type) {
    case 'isMobile':
      return { ...state, isMobile: action.payload };
    case 'isTablet':
      return { ...state, isTablet: action.payload };
    case 'sidebarToggle':
      return { ...state, sideBarToggle: action.payload };
    case 'editorToggle':
      return { ...state, tabsToggle: action.payload };
    case 'navMenuToggle':
      return { ...state, navMenuToggle: action.payload };
    case 'surface':
      return { ...state, surface: action.payload };
    case 'doc':
      return {
        ...state,
        doc: {
          payload: action.payload.payload,
          changedByEditor: action.payload.changedByEditor === undefined,
        },
      };
    default:
      return state;
  }
};
export default reducer;
