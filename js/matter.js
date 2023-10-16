


// Create an engine
var engine = Matter.Engine.create();

engine.world.gravity.x = 0;
engine.world.gravity.y = 0;
engine.timing.timeScale = 1;

const airFriction = 0.1;
const restitution = 0.5;
const angularResistance = 0.999;
const slop = 0.0;
const density = 0.001;

// Create a renderer for visualization
var render = Matter.Render.create({
  element: document.body,
  engine: engine,
});

const dirDetails={
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
  }
};

const circleDetails = { restitution, airFriction };

function applyCenteringForce(body, centerX, centerY) {
  const strength = 0.0001; // Adjust this value as needed

  // Calculate the distance from the body to the center
  let dx = centerX - body.position.x;
  let dy = centerY - body.position.y;

  // zero out the angular velocity
  Matter.Body.setAngularVelocity(body, body.angularVelocity / 2);

  // Apply the force
  Matter.Body.applyForce(body, body.position, {
    x: dx * strength,
    y: dy * strength,
  });
}

loadData("js/dependencies.json").then(data=>{
  const {bounds, dirs, circles, constraints} = first_layout(data, circleDetails, dirDetails, depDetails);
  Matter.World.add(engine.world, circles);
  //Matter.World.add(engine.world, dirs);
  //Matter.World.add(engine.world, constraints);
  const quads = dirs;

  Matter.Events.on(engine, "afterUpdate", function () {
    const centerX = 400; // Adjust to the desired center X position
    const centerY = 300; // Adjust to the desired center Y position
    for (let body of engine.world.bodies) {
      applyCenteringForce(body, centerX, centerY);
    }
    for (let quad of quads) quad.afterUpdate();
  });
  
  Matter.Engine.run(engine);
  Matter.Render.run(render);

});


