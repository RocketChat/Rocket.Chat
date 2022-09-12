module.export({useQuery:()=>useQuery});let QueryObserver;module.link('../core',{QueryObserver(v){QueryObserver=v}},0);let parseQueryArgs;module.link('../core/utils',{parseQueryArgs(v){parseQueryArgs=v}},1);let useBaseQuery;module.link('./useBaseQuery',{useBaseQuery(v){useBaseQuery=v}},2);

 // HOOK

function useQuery(arg1, arg2, arg3) {
  var parsedOptions = parseQueryArgs(arg1, arg2, arg3);
  return useBaseQuery(parsedOptions, QueryObserver);
}