function createHierarchicalData(data) {
  data.forEach(d => d.size = 1);
  var hierarchicalData =[];
  d3.nest().key(d => d.institution).entries(data)
    .forEach(d => hierarchicalData.push({"name": d.key, "children": d.values}));

  return {name: "main",children: hierarchicalData};
}
