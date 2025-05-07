const { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint, Events, Query, Constraint} = Matter;
let selectedBalls = [];

const springs = [];

const engine = Engine.create();
const world = engine.world;

// Set gravity from input
engine.gravity.y = parseFloat(document.getElementById('gravity').value);


const render = Render.create({
    element: document.body,
    engine: engine,
    canvas: document.getElementById('world'),
    options: {
        width: window.innerWidth - 250,
        height: window.innerHeight,
        wireframes: false,
        background: '#f0f0f0'
    }
});


const ground = Bodies.rectangle(
    (window.innerWidth - 250) / 2,
    window.innerHeight - 30,
    window.innerWidth,
    60,
    { isStatic: true, render: { fillStyle: 'gray' } }
);
World.add(world, ground);

const width = window.innerWidth - 250; // minus sidebar
const height = window.innerHeight;

// Walls
const wallThickness = 50;

const leftWall = Bodies.rectangle(0, height / 2, wallThickness, height, {
    isStatic: true,
    render: { fillStyle: 'gray' }
});

const rightWall = Bodies.rectangle(width, height / 2, wallThickness, height, {
    isStatic: true,
    render: { fillStyle: 'gray' }
});

const topWall = Bodies.rectangle(width / 2, 0, width, wallThickness, {
    isStatic: true,
    render: { fillStyle: 'gray' }
});

// Add to world
World.add(world, [leftWall, rightWall, topWall]);

// Track balls
const balls = [];


const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: { visible: false }
    }
});
World.add(world, mouseConstraint);
render.mouse = mouse;

Events.on(mouseConstraint, "mousedown", (event) => {
    const mousePos = event.mouse.position;
    const clicked = Query.point(balls, mousePos);

    if (clicked.length > 0) {
        const ball = clicked[0];

        if (selectedBalls.includes(ball)) {
            selectedBalls = selectedBalls.filter(b => b !== ball); // deselect if clicked again
            ball.render.strokeStyle = null;
        } else {
            selectedBalls.push(ball);
            ball.render.strokeStyle = 'yellow';
            ball.render.lineWidth = 3;
        }

        // Limit to two
        if (selectedBalls.length > 2) {
            selectedBalls[0].render.strokeStyle = null;
            selectedBalls.shift();
        }
    }
});

document.getElementById('removeConnection').addEventListener('click', () => {
    if (selectedBalls.length === 2) {
        const [ballA, ballB] = selectedBalls;

        // Find matching spring
        const springIndex = springs.findIndex(s =>
            (s.bodyA === ballA && s.bodyB === ballB) ||
            (s.bodyA === ballB && s.bodyB === ballA)
        );

        if (springIndex !== -1) {
            const spring = springs[springIndex];
            World.remove(world, spring);
            springs.splice(springIndex, 1);
        }

        // Clear highlights
        selectedBalls.forEach(ball => ball.render.strokeStyle = null);
        selectedBalls = [];
    }
});

document.getElementById('connectBalls').addEventListener('click', () => {
    if (selectedBalls.length !== 2) {
        alert("Please select exactly two balls.");
        return;
    }

    const [ballA, ballB] = selectedBalls;

    const stiffnessValue = parseFloat(document.getElementById('stiffness').value) || 0.05;
    const lengthValue = parseFloat(document.getElementById('springLength').value) || 100;

    const radiusA = ballA.circleRadius || 30;
    const radiusB = ballB.circleRadius || 30;

    const spring = Constraint.create({
        bodyA: ballA,
        bodyB: ballB,
        stiffness: 0.05,         // gentle pull
        damping: 0.01,           // slow energy loss
        length: radiusA + radiusB + 10, // just beyond touching
        collisionFilter: {
            collideConnected: true
        },
        render: {
            strokeStyle: 'red',
            lineWidth: 2
        }
    });


    springs.push(spring);
    World.add(world, spring);

    // Clear selection
    selectedBalls.forEach(ball => ball.render.strokeStyle = null);
    selectedBalls = [];
});




function removeBall() {

    const ball = balls.pop();
    World.remove(world, ball);
}

// Add ball function
function addBall() {
    const radius = 20 + 20;
    const x = Math.random() * (window.innerWidth - 300) + 50;
    const y = 50;

    const ball = Bodies.circle(x, y, radius, {
        restitution: 0.9, // higher = bouncier
        friction: 0.01,   // less stickiness
        frictionAir: 0.002, // allow some air resistance
        render: { fillStyle: 'blue' }
    });

    balls.push(ball);
    World.add(world, ball);
}



// Clear all balls
function clearBalls() {
    for (const ball of balls) {
        World.remove(world, ball);
    }
    balls.length = 0; // Clear array
}

// Utilities
function getRandomColor() {
    const colors = ['red', 'blue', 'green', 'orange', 'purple', 'teal'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// UI event listeners
document.getElementById('gravity').addEventListener('input', (e) => {
    engine.gravity.y = parseFloat(e.target.value);
});

document.getElementById('addBall').addEventListener('click', addBall);
document.getElementById('removeBall').addEventListener('click', removeBall);
document.getElementById('clearBalls').addEventListener('click', clearBalls);

// Initial ball
addBall();

// Run engine and renderer
Render.run(render);
Runner.run(Runner.create(), engine);
