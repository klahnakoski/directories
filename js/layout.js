const circleRadius = 10;
const space = 5;
const dirLineThickness = 10;
const dirDepth = 3;

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
    if (!loc["__files__"].includes(name)) loc["__files__"].push(name);
  }
  Object.entries(data).forEach(([k, v]) => {
    add(k);
    v.forEach((vv) => add(vv));
  });

  function grid(outerTopLeft, path, loc, depth) {
    if (depth == 0) return [Matter.Bounds.create([outerTopLeft, outerTopLeft]), [], {}];
    const innerTopLeft = chain(outerTopLeft)
      .add({ x: space + dirLineThickness + space, y: space + dirLineThickness + space })
      .get();
    const numColumns = Math.ceil(Math.sqrt(Object.keys(loc).length));
    let bounds = { min: innerTopLeft, max: innerTopLeft };
    const dirs = [];
    const circles = {};
    let left = innerTopLeft.x;
    let top = innerTopLeft.y;

    const children = Object.entries(loc).forEach(([k, v], i) => {
      const x = i % numColumns;
      if (x == 0) {
        left = innerTopLeft.x;
        top = bounds.max.y;
      }
      if (k == "__files__") {
        const numRows = Math.ceil(Math.sqrt(loc["__files__"].length));
        const childCircles = Object.fromEntries(
          loc["__files__"].map((file, i) => {
            const x = i % numRows;
            const y = Math.floor(i / numRows);
            return [
              [...path, file].join("/"),
              Matter.Bodies.circle(x * 2 * (circleRadius + space) + circleRadius + left, y * 2 * (circleRadius + space) + circleRadius + top, circleRadius, { label: path.join("/") + "/" + file, ...circleDetails }),
            ];
          })
        );
        const childBounds = unionBounds(...Object.values(childCircles).map((c) => c.bounds));
        bounds = unionBounds(bounds, childBounds);
        Object.assign(circles, childCircles);
        left = childBounds.max.x;
      } else {
        const [childBounds, childDirs, childCircles] = grid({ x: left, y: top }, [...path, k], v, depth - 1);
        bounds = unionBounds(bounds, childBounds);
        dirs.push(...childDirs);
        Object.assign(circles, childCircles);
        left = childBounds.max.x;
      }
    });

    // add a dir around this
    const box = chain(bounds.max).sub(bounds.min).get();
    const sideLength = Math.max(box.x, box.y);
    const c = space + dirLineThickness + space + sideLength / 2;
    const center = chain(outerTopLeft).add({ x: c, y: c }).get();
    const dir = createSquare(center, space + sideLength + space, dirDetails);
    dirs.push(dir);
    bounds = unionBounds(bounds, ...dir.bodies.map((b) => b.bounds));

    return [bounds, dirs, circles];
  }

  const [bounds, dirs, circles] = grid({ x: 0, y: 0 }, [], deepData, dirDepth);

  //add constraints to related circles
  const constraints = Object.entries(circles).flatMap(([name, circle]) => {
    if (!data[name]) return [];
    return data[name].map((depName) => {
      const depC = circles[depName];
      if (!depC) return null
      return Matter.Constraint.create({
        bodyA: circle,
        bodyB: depC,
        pointA: { x: 0, y: 0 },
        pointB: { x: 0, y: 0 },
        stiffness: 0,
        length: 1000,
        ...depDetails,
        label: circle.label + "->" + depName,
      });
    }).filter(c=>c!=null);
  });

  return { bounds, dirs, circles: Object.values(circles), constraints };
}
