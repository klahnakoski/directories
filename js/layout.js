const circleRadius = 10;

function first_layout(data, circleDetails, dirDetails, depDetails) {
  // use a simple layout for the circles and dirs

  const deepData = {};

  function add(filename) {
    path = filename.split("/");
    let loc = deepData;
    for (let step of path.slice(0, -1)) {
      if (!loc[step]) {
        loc[step] = {};
      }
      loc = loc[step];
    }
    const name = path.slice(-1)[0];
    if (!loc["__files__"]) {
      loc["__files__"] = [];
    }
    if (!loc["__files__"].includes(name))
      loc["__files__"].push(name);
  }
  Object.entries(data).forEach(([k, v]) => {
    add(k);
    v.forEach((vv) => add(vv));
  });

  function grid(topLeft, path, loc) {
    const numColumns = Math.ceil(Math.sqrt(Object.keys(loc).length));
    let bounds = { min: topLeft, max: topLeft };
    const dirs = [];
    const circles = {};
    let left = topLeft.x;
    let top = topLeft.y;

    const children = Object.entries(loc).forEach(([k, v], i) => {
      const x = i % numColumns;
      if (x == 0) {
        left = topLeft.x;
        top = bounds.max.y;
      }
      if (k == "__files__"){
        const childCircles = Object.fromEntries(
          loc["__files__"].map((file, i) => {
            const x = i % numColumns;
            const y = Math.floor(i / numColumns);
            return [[...path, file].join("/"), Matter.Bodies.circle(x * circleRadius + left, y * circleRadius + top, circleRadius, { label: path.join("/") + "/" + file, ...circleDetails })];
          })
        );
        const childBounds = unionBounds(...Object.values(childCircles).map(c=>c.bounds));
        bounds = unionBounds(bounds, childBounds);
        Object.assign(circles, childCircles);
        left = childBounds.max.x;
      }else{
        const [childBounds, childDirs, childCircles] = grid({ x: left, y: top }, [...path, k], v);
        bounds =unionBounds(bounds, childBounds);
        dirs.push(...childDirs);
        Object.assign(circles, childCircles);
        left = childBounds.max.x;
        }
    });

    // add a dir around this
    const box = chain(bounds.max).sub(bounds.min);
    const center = box.mult(0.5).add(bounds.min).get();
    const sideLength = Math.max(box.get().x, box.get().y);
    const dir = createSquare(center, sideLength, dirDetails);
    dirs.push(dir);
    bounds = unionBounds(bounds, ...dir.bodies.map(b=>b.bounds));

    return [bounds, dirs, circles];
  }

  const [bounds, dirs, circles] = grid({ x: 0, y: 0 }, [], deepData);

  //add constraints to related circles
  const constraints = Object.entries(circles).flatMap(([name, circle]) =>
    data[name] ?? [] .map(dep =>
      Matter.Constraint.create({
        bodyA: circle,
        bodyB: circles[dep],
        pointA: { x: 0, y: 0 },
        pointB: { x: 0, y: 0 },
        ...depDetails,
        label: circle.label + "->" + dep,
      })
    )
  );

  return {bounds, dirs, circles:Object.entries(circles), constraints};
}
