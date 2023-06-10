import type { initialStateType } from './initialState';

type actionType = { type: string; payload: any };

const reducer = (state: initialStateType, action: actionType) => {
  switch (action.type) {
    case 'isMobile':
      return { ...state, isMobile: action.payload };
    case 'isTablet':
      return { ...state, isTablet: action.payload };
    case 'sidebarToggle':
      return { ...state, sideBarToggle: action.payload };
    case 'previewToggle':
      return { ...state, previewTabsToggle: action.payload };
    case 'editorToggle':
      return { ...state, editorTabsToggle: action.payload };
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
    case 'actionPreview':
      return { ...state, actionPreview: action.payload };
    case 'user':
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

export default reducer;
