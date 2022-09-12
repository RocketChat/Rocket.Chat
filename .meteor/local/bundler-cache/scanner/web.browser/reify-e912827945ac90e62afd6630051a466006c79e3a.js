module.export({useMutation:()=>useMutation});let _extends;module.link("@babel/runtime/helpers/esm/extends",{default(v){_extends=v}},0);let React;module.link('react',{default(v){React=v}},1);let notifyManager;module.link('../core/notifyManager',{notifyManager(v){notifyManager=v}},2);let noop,parseMutationArgs;module.link('../core/utils',{noop(v){noop=v},parseMutationArgs(v){parseMutationArgs=v}},3);let MutationObserver;module.link('../core/mutationObserver',{MutationObserver(v){MutationObserver=v}},4);let useQueryClient;module.link('./QueryClientProvider',{useQueryClient(v){useQueryClient=v}},5);let shouldThrowError;module.link('./utils',{shouldThrowError(v){shouldThrowError=v}},6);





 // HOOK

function useMutation(arg1, arg2, arg3) {
  var mountedRef = React.useRef(false);

  var _React$useState = React.useState(0),
      forceUpdate = _React$useState[1];

  var options = parseMutationArgs(arg1, arg2, arg3);
  var queryClient = useQueryClient();
  var obsRef = React.useRef();

  if (!obsRef.current) {
    obsRef.current = new MutationObserver(queryClient, options);
  } else {
    obsRef.current.setOptions(options);
  }

  var currentResult = obsRef.current.getCurrentResult();
  React.useEffect(function () {
    mountedRef.current = true;
    var unsubscribe = obsRef.current.subscribe(notifyManager.batchCalls(function () {
      if (mountedRef.current) {
        forceUpdate(function (x) {
          return x + 1;
        });
      }
    }));
    return function () {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);
  var mutate = React.useCallback(function (variables, mutateOptions) {
    obsRef.current.mutate(variables, mutateOptions).catch(noop);
  }, []);

  if (currentResult.error && shouldThrowError(undefined, obsRef.current.options.useErrorBoundary, [currentResult.error])) {
    throw currentResult.error;
  }

  return _extends({}, currentResult, {
    mutate: mutate,
    mutateAsync: currentResult.mutate
  });
}