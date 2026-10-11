module.exports = [
    { name: 'Latency p95', metric: 'http_req_duration', field: 'p(95)' },
    { name: 'Latency avg', metric: 'http_req_duration', field: 'avg' },
    { name: 'Error rate', metric: 'http_req_failed', field: 'value' },
    { name: 'RPS', metric: 'http_reqs', field: 'rate' },
  ];
  