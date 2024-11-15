module.export({ensurePreventErrorBoundaryRetry:()=>ensurePreventErrorBoundaryRetry,getHasError:()=>getHasError,useClearResetErrorBoundary:()=>useClearResetErrorBoundary});let React;module.link('react',{"*"(v){React=v}},0);let shouldThrowError;module.link('./utils.esm.js',{shouldThrowError(v){shouldThrowError=v}},1);


const ensurePreventErrorBoundaryRetry = (options, errorResetBoundary) => {
  if (options.suspense || options.useErrorBoundary) {
    // Prevent retrying failed query if the error boundary has not been reset yet
    if (!errorResetBoundary.isReset()) {
      options.retryOnMount = false;
    }
  }
};
const useClearResetErrorBoundary = errorResetBoundary => {
  React.useEffect(() => {
    errorResetBoundary.clearReset();
  }, [errorResetBoundary]);
};
const getHasError = ({
  result,
  errorResetBoundary,
  useErrorBoundary,
  query
}) => {
  return result.isError && !errorResetBoundary.isReset() && !result.isFetching && shouldThrowError(useErrorBoundary, [result.error, query]);
};


//# sourceMappingURL=errorBoundaryUtils.esm.js.map
