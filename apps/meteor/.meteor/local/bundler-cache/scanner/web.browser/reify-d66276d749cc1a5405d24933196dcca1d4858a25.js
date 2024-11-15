let Chart,registerables;module.link('../dist/chart.esm.js',{Chart(v){Chart=v},registerables(v){registerables=v}},0);

Chart.register(...registerables);

module.exportDefault(Chart);
