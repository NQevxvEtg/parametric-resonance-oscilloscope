// oscilloscope.js

let animationFrameId;
let oscilloscopeParams = {};
let time = 0;
let charge = 0.0001;
let current = 0.001;
let dataPoints = [];
let timeData = [];
let canvas, ctx;

// Function to update oscilloscope parameters from script.js
function updateOscilloscopeParameters(params) {
    console.log('Updating oscilloscope parameters:', params);
    oscilloscopeParams = params;
    resetSimulation();
}

// Initialize the oscilloscope
function initOscilloscope() {
    canvas = document.getElementById('oscilloscope');
    console.log('Initializing oscilloscope...');
    if (!canvas) {
        console.error('Canvas element with id "oscilloscope" not found.');
        return;
    }
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Failed to get 2D context from canvas.');
        return;
    }
    console.log('Canvas and context initialized.');

    // Resize canvas to fit container
    resizeCanvas();

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);

    // Start the simulation
    resetSimulation();
}

// Function to resize the canvas responsively
function resizeCanvas() {
    if (!canvas.parentElement) return;
    const parentWidth = canvas.parentElement.clientWidth;
    canvas.width = parentWidth - 50; // Adjust for padding/margin
    canvas.height = parentWidth * 0.6; // Maintain aspect ratio (e.g., 600px width -> 360px height)
    console.log(`Canvas resized to ${canvas.width}x${canvas.height}`);
}

// Reset the simulation
function resetSimulation() {
    cancelAnimationFrame(animationFrameId);
    time = 0;
    charge = 0.0001;
    current = 0.001;
    dataPoints = [];
    timeData = [];
    simulate();
}

// Simulation loop using Euler's method
function simulate() {
    if (!oscilloscopeParams || Object.keys(oscilloscopeParams).length === 0) {
        // Parameters not set yet, wait for script.js to set them
        animationFrameId = requestAnimationFrame(simulate);
        return;
    }

    const { inductanceBase, inductanceVariationPercent, omega_p, capacitance, resistance, dt, maxDataPoints } = oscilloscopeParams;

    // Apply Euler's method
    const deltaL = (inductanceVariationPercent / 100) * inductanceBase;
    const inductance = inductanceBase + deltaL * Math.sin(omega_p * time);
    const dCurrent = (-resistance * current - charge / capacitance) / inductance;

    // Update current and charge
    current += dCurrent * dt;
    charge += current * dt;

    // Calculate power (P = I^2 * R)
    const power = current * current * resistance;

    // Store data
    dataPoints.push(power);
    timeData.push(time);
    if (dataPoints.length > maxDataPoints) {
        dataPoints.shift();
        timeData.shift();
    }

    // Draw oscilloscope
    drawOscilloscope();

    // Increment time
    time += dt;

    // Continue simulation
    animationFrameId = requestAnimationFrame(simulate);
}

// Function to draw the oscilloscope plot
function drawOscilloscope() {
    if (!ctx) {
        console.error('Canvas context is undefined.');
        return;
    }

    // Clear canvas
    ctx.fillStyle = 'black'; // Set background color to black
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Determine scaling
    const maxPower = Math.max(...dataPoints.map(Math.abs));
    const yScale = (canvas.height / 2) / (maxPower || 1);

    // Determine time scaling based on maxDataPoints
    const maxTime = timeData.length > 0 ? timeData[timeData.length - 1] : 0;
    const xScale = canvas.width / (oscilloscopeParams.maxDataPoints || 1);

    // Draw grid
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;

    // Draw horizontal grid lines
    for (let i = 0; i <= 4; i++) {
        let y = (canvas.height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw vertical grid lines
    for (let i = 0; i <= 4; i++) {
        let x = (canvas.width / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Draw waveform
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < dataPoints.length; i++) {
        const x = (i / (oscilloscopeParams.maxDataPoints - 1)) * canvas.width;
        const y = (canvas.height / 2) - (dataPoints[i] * yScale);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    // Draw dynamic axis labels
    drawAxisLabels(maxPower, maxTime, yScale, xScale);
}

// Function to draw dynamic axis labels directly on the canvas
function drawAxisLabels(maxPower, maxTime, yScale, xScale) {
    if (!ctx) {
        console.error('Canvas context is undefined.');
        return;
    }

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Y-axis labels on the LEFT side
    for (let i = 0; i <= 4; i++) {
        let y = (canvas.height / 4) * i;
        let powerValue = ((canvas.height / 2 - y) / yScale).toFixed(2);
        ctx.fillText(`${powerValue} W`, 30, y); // Positioning at x = 30 (left side)
    }

    // X-axis labels at the bottom
    for (let i = 0; i <= 4; i++) {
        let x = (canvas.width / 4) * i;
        let timeValue = (maxTime * (i / 4)).toFixed(2);
        timeValue = maxTime < 1 ? (timeValue * 1000).toFixed(0) + ' ms' : timeValue + ' s';
        ctx.fillText(timeValue, x, canvas.height - 15);
    }
}

// Initialize the oscilloscope on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initOscilloscope();
});
