const stretchFactor = 1e-2;
const stretchOffset = -2;
const torqueFactor = 1e1;
const degree90 = Math.PI / 2;
const thickness = 10;

function createSquare(center, sideLength, details) {
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
        
    );
  });

  // Connect the lines using constraints
  const constraints = lines.map((lineA, i) => {
    let nextIdx = (i + 1) % 4; // To loop back to the first line after the last one
    const lineB = lines[nextIdx];
    const angle = toRadians(i * 90);

    const pointA = chain({ x: halfSide, y: halfThickness }).rotate(angle);
    const pointB = chain({ x: -halfSide, y: halfThickness })
      .rotate(angle + degree90)
      ;

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
  composite.afterUpdate = afterUpdate.bind(composite);
  return composite;
}

function afterUpdate() {
  const verts = this.bodies.map((b) => b.vertices.map((v) => chain(v).sub(b.position)));
  this.constraints.forEach((con, i) => {
    const forceVector = chain(con.pointA).add(con.bodyA.position).sub(con.pointB).sub(con.bodyB.position);
    const delta = chain(forceVector).magnitude();
    const bodyA = con.bodyA;
    const bodyB = con.bodyB;
    const vertA = verts[i];
    const vertB = verts[(i + 1) % 4];

    const a = chain(forceVector).mult(-1).rotate(-bodyA.angle).x().add({x:stretchOffset, y:0}).mult(stretchFactor).rotate(bodyA.angle);
    vertA[1] = chain(vertA[1]).add(a);
    vertA[2] = chain(vertA[2]).add(a);
    con.pointA = vertA[2];

    const b = chain(forceVector).rotate(-bodyB.angle).x().add({x:-stretchOffset, y:0}).mult(stretchFactor).rotate(bodyB.angle);
    vertB[0] = chain(vertB[0]).add(b);
    vertB[3] = chain(vertB[3]).add(b);
    con.pointB = vertB[3];

    // add torque to ensure constraint is 90 degrees
    torque = Math.tan(bodyB.angle-bodyA.angle-degree90)*torqueFactor;
    bodyA.torque=torque;
    bodyB.torque=-torque;
  });

  this.bodies.forEach((body, i) => {
    const original = body.vertices.map((v) => chain(v));
    Matter.Body.setVertices(body, verts[i]);
  });
}
