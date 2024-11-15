module.export({QueryErrorResetBoundary:()=>QueryErrorResetBoundary,useQueryErrorResetBoundary:()=>useQueryErrorResetBoundary});let React;module.link('react',{"*"(v){React=v}},0);

function createValue() {
  let isReset = false;
  return {
    clearReset: () => {
      isReset = false;
    },
    reset: () => {
      isReset = true;
    },
    isReset: () => {
      return isReset;
    }
  };
}

const QueryErrorResetBoundaryContext = /*#__PURE__*/React.createContext(createValue()); // HOOK

const useQueryErrorResetBoundary = () => React.useContext(QueryErrorResetBoundaryContext); // COMPONENT

const QueryErrorResetBoundary = ({
  children
}) => {
  const [value] = React.useState(() => createValue());
  return /*#__PURE__*/React.createElement(QueryErrorResetBoundaryContext.Provider, {
    value: value
  }, typeof children === 'function' ? children(value) : children);
};


//# sourceMappingURL=QueryErrorResetBoundary.esm.js.map
