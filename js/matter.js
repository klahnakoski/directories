// Create an engine
var engine = Matter.Engine.create();

engine.world.gravity.x = 0;
engine.world.gravity.y = 0;
engine.timing.timeScale = 1e-2;

const airFriction = 0.8;
const restitution = 0.5;
const angularResistance = 0.999;
const slop = 0.0;
const density = 0.001;
const windowBorder = 20

// Create renderer
var render = Matter.Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: window.innerWidth-windowBorder,
    height: window.innerHeight-windowBorder,
  },
});

let centerX = window.innerWidth/2;
let centerY = window.innerHeight/2

// Resize listener
window.addEventListener("resize", function () {
  render.canvas.width = window.innerWidth-windowBorder;
  render.canvas.height = window.innerHeight-windowBorder;
  centerX = window.innerWidth/2;
  centerY = window.innerHeight/2
});

const dirDetails = {
  density,
  slop,
  restitution,
  airFriction,
  angularResistance,
};

const depDetails = {
  stiffness: 1e-1,
  length: 10,
  render: {
    lineWidth: 1,
    strokeStyle: "#FAA",
  },
};

const circleDetails = {
  restitution,
  airFriction,
  render: {
    fillStyle: "blue",
    strokeStyle: "blue",
    lineWidth: 3,
  },
};

function applyCenteringForce(bodies) {
  const strength = 1e-5; // Adjust this value as needed

  bodies.forEach(body => {
    const force = chain(body.position).sub({x:centerX, y:centerY}).mult(-strength).get();
    Matter.Body.applyForce(body, body.position, force);

    // zero out the angular velocity
    Matter.Body.setAngularVelocity(body, 0);
    Matter.Body.setVelocity(body, Vector.zero.get());
  });
}

function repel(bodies){
  const strength = 1e-2; // Adjust this value as needed
  bodies.forEach(body => {
    //sum the forces from all other bodies
    let force = Vector.zero;
    const pos = chain(body.position);
    bodies.filter(b=>b!=body).forEach(otherBody=>{
      const f=pos.sub(otherBody.position);
      const mag = f.magnitude();
      force = force.add(f.mult(strength/Math.pow(mag, 2)).get());
    });
    // Apply the force
    Matter.Body.applyForce(body, body.position, force.get());
  });
}

loadData("js/dependencies.json").then((data) => {
  const { bounds, dirs, circles, constraints } = first_layout(data, circleDetails, dirDetails, depDetails);
  Matter.World.add(engine.world, circles);
  Matter.World.add(engine.world, dirs);
  //Matter.World.add(engine.world, constraints);
  const quads = dirs;

  Matter.Events.on(engine, "afterUpdate", function () {
    const centerX = 400; // Adjust to the desired center X position
    applyCenteringForce(engine.world.bodies);
    repel(engine.world.bodies);
    for (let quad of quads) quad.afterUpdate();
  });

  Matter.Engine.run(engine);
  Matter.Render.run(render);
});
