const circleRadius = 10;
const space = 5;
const dirLineThickness = 10;
const dirDepth = 3;
const attractFactor = 1e-2;
const repelFactor = 1e1;

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

    const dirs = [];
    const circles = {};
    const containers = [];
    const siblingDirs = [];

    function grid(outerTopLeft, path, loc, depth) {
        const innerTopLeft = outerTopLeft.add({ x: space + dirLineThickness + space, y: space + dirLineThickness + space });
        const numColumns = Math.ceil(Math.sqrt(Object.keys(loc).length));
        let bounds = new Bounds(innerTopLeft, innerTopLeft);
        let left = innerTopLeft.x;
        let top = innerTopLeft.y;

        const internal = [];
        const peerDirs = []
        Object.entries(loc).flatMap(([k, v], i) => {
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
                            new Circle({ x: x * 2 * (circleRadius + space) + circleRadius + left, y: y * 2 * (circleRadius + space) + circleRadius + top }, circleRadius, { label: path.join("/") + "/" + file, ...circleDetails }),
                        ];
                    })
                );
                const temp = new Vector({ x: left, y: top });
                const childBounds = new Bounds(temp, temp).union(...Object.values(childCircles).map(c => c.getBounds()));
                bounds = bounds.union(childBounds);
                Object.assign(circles, childCircles);
                left = childBounds.max.x;
                internal.push(...Object.values(childCircles));
            } else {
                if (depth==0) return [];
                const {bounds:childBounds, dir:childDir, internal:childInternal} = grid(chain({ x: left, y: top }), [...path, k], v, depth - 1);
                bounds = bounds.union(childBounds);
                left = childBounds.max.x;
                internal.push(...childInternal);
                internal.push(...childDir.points);
                peerDirs.push(childDir);
            }
        });

        peerDirs.forEach((dir1, i)=>{
            peerDirs.slice(i+1).forEach(dir2=>{   
                siblingDirs.push({quad:dir1, other:dir2});
            })
        });

        // add a dir around this
        const box = bounds.max.sub(bounds.min);
        const sideLength = Math.max(box.x, box.y);
        const c = space + dirLineThickness + space + sideLength / 2;
        const center = outerTopLeft.add({ x: c, y: c });
        const dir = createSquare(center, space + sideLength + space, dirLineThickness, dirDetails);
        dirs.push(dir);
        containers.push({dir, internal:internal});
        bounds = bounds.union(dir.getBounds());

        return {bounds, dir, internal};
    }

    grid(chain({ x:200, y: 200 }), [], deepData, dirDepth);

    // every circle repels others
    const fields = Object.values(circles).flatMap((circle, i)=>
        Object.values(circles).slice(i+1).map(other=>{
            return {circle, other, repelFactor};
        })
    );

    // connected circles attract each other
    const forces = [];
    Object.values(circles).forEach(circle => {
      circle.peers = [];
    });
    Object.entries(circles).forEach(([name, circle]) => {
        if (!data[name]) return;
        data[name].forEach(depName => {
            const other = circles[depName];
            if (!other) return;
            forces.push({circle, other, attractFactor})
            other.peers.push(circle);
            circle.peers.push(other);
        });
    });

    // every container repels external circles
    const allCircles = Object.values(circles);
    containers.forEach(args=>{
        const {internal} = args;
        args.external = [];  //allCircles.filter(c=>!internal.includes(c));
    });

    return { circles: Object.values(circles), quads: dirs, forces, fields, siblingDirs, containers};
}

