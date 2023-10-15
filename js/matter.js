// Create an engine
var engine = Matter.Engine.create();

engine.world.gravity.x = 0;
engine.world.gravity.y = 0;
engine.timing.timeScale = 0.1;

const airFriction = 0.1;
const restitution = 0.5;
const angularResistance = 0.999;
const slop = 0.0;
const density = 0.001;
const degree90 = Math.PI / 2;

// Create a renderer for visualization
var render = Matter.Render.create({
  element: document.body,
  engine: engine,
});

// Create a circle and a line (represented by a thin rectangle in this case)
var circle = Matter.Bodies.circle(250, 250, 50, { restitution, airFriction });

// Add all bodies to the world
Matter.World.add(engine.world, [circle]);

function createSquare(centerX, centerY, sideLength) {
  const center = { x: centerX, y: centerY };
  const thickness = 10;
  const halfSide = sideLength / 2;
  const halfThickness = thickness / 2;
  const details = {
    density,
    slop,
    restitution,
    airFriction,
    angularResistance,
  };

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

    const pointA = chain({x:halfSide, y:halfThickness}).rotate(angle).get();
    const pointB = chain({x:-halfSide, y:halfThickness}).rotate(angle+degree90).get()

    return Matter.Constraint.create({
      bodyA: lineA,
      bodyB: lineB,
      pointA: pointA,
      pointB: pointB,
      stiffness: 1e-3,
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
  Matter.World.add(engine.world, composite);
}

// Usage:
const quads = [];

createSquare(250, 250, 300);

function applyCenteringForce(body, centerX, centerY) {
  const strength = 0.0001; // Adjust this value as needed

  // Calculate the distance from the body to the center
  let dx = centerX - body.position.x;
  let dy = centerY - body.position.y;

  // zero out the angular velocity
  //Matter.Body.setAngularVelocity(body, body.angularVelocity/2);

  // Apply the force
  Matter.Body.applyForce(body, body.position, {
    x: dx * strength,
    y: dy * strength,
  });
}

function getOriginalVertices(body) {
  const pos = body.position;
  const angle = body.angle;
  const vertices = body.vertices.map((v) => {
    return chain(v).sub(pos).rotate(-angle).add(pos).get();
  });
  return vertices;
}

const stretchFactor = 1e-2

Matter.Events.on(engine, "afterUpdate", function () {
  const centerX = 400; // Adjust to the desired center X position
  const centerY = 300; // Adjust to the desired center Y position
  for (let body of engine.world.bodies) {
    applyCenteringForce(body, centerX, centerY);
  }
   for (let quad of quads) {
     const verts = quad.bodies.map(b=>b.vertices.map(v=>chain(v).sub(b.position).get()));
    quad.constraints.forEach((con, i) => {
      const forceVector = chain(con.pointA).add(con.bodyA.position).sub(con.pointB).sub(con.bodyB.position).get();
      const delta = chain(forceVector).magnitude();
      const bodyA = con.bodyA;
      const bodyB = con.bodyB;
      const vertA = verts[i];
      const vertB = verts[(i+1)%4];

  
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
      const original = body.vertices.map(v=>chain(v).get())
      Matter.Body.setVertices(body, verts[i]);
      applyCenteringForce(body, centerX, centerY);
    });
  }
});

// Run the engine
Matter.Engine.run(engine);

// Run the renderer
Matter.Render.run(render);
