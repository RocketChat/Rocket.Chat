module.export({useInfiniteQuery:()=>useInfiniteQuery});let InfiniteQueryObserver;module.link('../core/infiniteQueryObserver',{InfiniteQueryObserver(v){InfiniteQueryObserver=v}},0);let parseQueryArgs;module.link('../core/utils',{parseQueryArgs(v){parseQueryArgs=v}},1);let useBaseQuery;module.link('./useBaseQuery',{useBaseQuery(v){useBaseQuery=v}},2);

 // HOOK

function useInfiniteQuery(arg1, arg2, arg3) {
  var options = parseQueryArgs(arg1, arg2, arg3);
  return useBaseQuery(options, InfiniteQueryObserver);
}