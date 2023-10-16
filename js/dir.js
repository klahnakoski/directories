function createSquare(center, sideLength, details) {
  const thickness = 10;
  const halfSide = sideLength / 2;
  const halfThickness = thickness / 2;
 
  // Define the four lines for the square
  const lines = [
    Matter.Bodies.rectangle(0, 0, sideLength, thickness, { label: "top", ...details }), // Top
    Matter.Bodies.rectangle(0, 0, sideLength, thickness, { label: "right", ...details }), // Right
    Matter.Bodies.rectangle(0, 0, sideLength, thickness, { label: "bottom", ...details }), // Bottom
    Matter.Bodies.rectangle(0, 0, sideLength, thickness, { label: "left", ...details }), // Left
  ];
  // Rotate the lines to the correct angle
  lines.forEach((line, i) => {
    const angle = toRadians(i * 90);
    Matter.Body.rotate(line, angle);
    Matter.Body.setPosition(
      line,
      chain({ x: 0, y: -halfSide - halfThickness })
        .rotate(angle)
        .add(center)
        .get()
    );
  });

  // Connect the lines using constraints
  const constraints = lines.map((lineA, i) => {
    let nextIdx = (i + 1) % 4; // To loop back to the first line after the last one
    const lineB = lines[nextIdx];
    const angle = toRadians(i * 90);

    const pointA = chain({ x: halfSide, y: halfThickness }).rotate(angle).get();
    const pointB = chain({ x: -halfSide, y: halfThickness })
      .rotate(angle + degree90)
      .get();

    return Matter.Constraint.create({
      bodyA: lineA,
      bodyB: lineB,
      pointA: pointA,
      pointB: pointB,
      stiffness: 1e-1,
      length: 10,
      render: {
        lineWidth: 1,
        strokeStyle: "#FAA",
      },
      label: lineA.label + "-" + lineB.label,
    });
  });

  const composite = Matter.Composite.create({
    bodies: lines,
    constraints: constraints,
  });
  quads.push(composite);
  quads.afterUpdate = afterUpdate;
  Matter.World.add(engine.world, composite);
}

function afterUpdate() {
  const verts = quad.bodies.map((b) => b.vertices.map((v) => chain(v).sub(b.position).get()));
  quad.constraints.forEach((con, i) => {
    const forceVector = chain(con.pointA).add(con.bodyA.position).sub(con.pointB).sub(con.bodyB.position).get();
    const delta = chain(forceVector).magnitude();
    const bodyA = con.bodyA;
    const bodyB = con.bodyB;
    const vertA = verts[i];
    const vertB = verts[(i + 1) % 4];

    const a = chain(forceVector).mult(-1).rotate(-bodyA.angle).x().mult(stretchFactor).rotate(bodyA.angle).get();
    vertA[1] = chain(vertA[1]).add(a).get();
    vertA[2] = chain(vertA[2]).add(a).get();
    con.pointA = vertA[2];

    const b = chain(forceVector).rotate(-bodyB.angle).x().mult(stretchFactor).rotate(bodyB.angle).get();
    vertB[0] = chain(vertB[0]).add(b).get();
    vertB[3] = chain(vertB[3]).add(b).get();
    con.pointB = vertB[3];
  });

  quad.bodies.forEach((body, i) => {
    const original = body.vertices.map((v) => chain(v).get());
    Matter.Body.setVertices(body, verts[i]);
  });
}
