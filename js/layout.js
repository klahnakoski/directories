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
    if (depth == 0) return [new Bounds(outerTopLeft, outerTopLeft), [], {}];
    const innerTopLeft = chain(outerTopLeft)
      .add({ x: space + dirLineThickness + space, y: space + dirLineThickness + space })
      ;
    const numColumns = Math.ceil(Math.sqrt(Object.keys(loc).length));
    let bounds = new Bounds(innerTopLeft, innerTopLeft);
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
              new Circle({x: x * 2 * (circleRadius + space) + circleRadius + left, y:y * 2 * (circleRadius + space) + circleRadius + top}, circleRadius, {label: path.join("/") + "/" + file, ...circleDetails }),
            ];
          })
        );
        const temp = {x:left, y:top};
        const childBounds = new Bounds(temp, temp).union(...Object.values(childCircles).map(c=>c.getBounds()));
        bounds = bounds.union(childBounds);
        Object.assign(circles, childCircles);
        left = childBounds.max.x;
      } else {
        const [childBounds, childDirs, childCircles] = grid({ x: left, y: top }, [...path, k], v, depth - 1);
        bounds = bounds.union(childBounds);
        dirs.push(...childDirs);
        Object.assign(circles, childCircles);
        left = childBounds.max.x;
      }
    });

    // add a dir around this
    const box = chain(bounds.max).sub(bounds.min);
    const sideLength = Math.max(box.x, box.y);
    const c = space + dirLineThickness + space + sideLength / 2;
    const center = chain(outerTopLeft).add({ x: c, y: c });
    const dir = createSquare(center, space + sideLength + space, dirDetails);
    dirs.push(dir);
    bounds = bounds.union(...dir.bodies.map((b) => b.bounds));

    return [bounds, dirs, circles];
  }

  const [bounds, dirs, circles] = grid({ x: 0, y: 0 }, [], deepData, dirDepth);

    // fields
    const length = Object.values(circles).length;
    const fields = Array.from({ length }, () => Array.from({ length }, () => 1.0));

  Object.entries(circles).forEach(([name, circle], i) => {
    if (!data[name]) return;
    data[name].forEach((depName, j) => {
      const depC = circles[depName];
      if (!depC) return;
      fields[i][j] = -1.0;
    });
  });

  return { bounds, dirs, circles: Object.values(circles), fields };
}
