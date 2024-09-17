// oscilloscope.js

let animationFrameId;
let oscilloscopeParams = {};
let time = 0;
let charge = 0.0001;
let current = 0.001;
let dataPoints = [];
let timeData = [];
let canvas, ctx;

// Toggle states for plotting
let showCurrent = true;
let showVoltage = true;
let showPower = true;

// Function to update oscilloscope parameters from script.js
function updateOscilloscopeParameters(params) {
    console.log('Updating oscilloscope parameters:', params);
    oscilloscopeParams = params;
    // No need to reset simulation here; it will be called separately if needed
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
    canvas.height = parentWidth * 0.6; // Maintain aspect ratio
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

    // Calculate voltage across the capacitor
    const voltage = charge / capacitance;

    // Calculate power
    const power = current * current * resistance;

    // Store current, voltage, and power for plotting
    dataPoints.push({ current, voltage, power });
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

    // Draw zero line
    ctx.strokeStyle = '#888';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Determine scaling for current, voltage, and power
    const quantitiesToShow = [];
    if (showCurrent) quantitiesToShow.push('current');
    if (showVoltage) quantitiesToShow.push('voltage');
    if (showPower) quantitiesToShow.push('power');

    const allValues = quantitiesToShow.flatMap(q => dataPoints.map(point => point[q]));
    const maxAmplitude = Math.max(...allValues.map(Math.abs)) || 1;
    const yScale = (canvas.height / 2) / maxAmplitude;

    // Draw each waveform
    quantitiesToShow.forEach(quantity => {
        let color;
        switch (quantity) {
            case 'current':
                color = 'lime';
                break;
            case 'voltage':
                color = 'yellow';
                break;
            case 'power':
                color = 'red';
                break;
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < dataPoints.length; i++) {
            const x = (i / (oscilloscopeParams.maxDataPoints - 1)) * canvas.width;
            const y = (canvas.height / 2) - (dataPoints[i][quantity] * yScale);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    });

    // Draw dynamic axis labels
    const maxTime = timeData.length > 0 ? timeData[timeData.length - 1] : 0;
    drawAxisLabels(maxAmplitude, maxTime);

    // Draw legend
    drawLegend();
}

// Function to draw dynamic axis labels directly on the canvas
function drawAxisLabels(maxAmplitude, maxTime) {
    if (!ctx) {
        console.error('Canvas context is undefined.');
        return;
    }

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Y-axis labels
    for (let i = -2; i <= 2; i++) {
        let y = canvas.height / 2 - (i * (canvas.height / 4));
        let amplitudeValue = (i * maxAmplitude / 2).toFixed(2);
        ctx.fillText(`${amplitudeValue}`, 5, y);
    }

    // X-axis labels at the bottom
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (let i = 0; i <= 4; i++) {
        let x = (canvas.width / 4) * i;
        let timeValue = (maxTime * (i / 4)).toFixed(3);
        ctx.fillText(`${timeValue} s`, x, canvas.height - 5);
    }
}

// Function to draw legend
function drawLegend() {
    let items = [];
    if (showCurrent) items.push({ color: 'lime', label: 'Current (A)' });
    if (showVoltage) items.push({ color: 'yellow', label: 'Voltage (V)' });
    if (showPower) items.push({ color: 'red', label: 'Power (W)' });

    const legendHeight = items.length * 15 + 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 120, legendHeight);

    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    items.forEach((item, index) => {
        ctx.fillStyle = item.color;
        ctx.fillText(`— ${item.label}`, 20, 15 + index * 15);
    });
}

// Initialize the oscilloscope on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initOscilloscope();

    // Handle toggle switches
    const toggleCurrentCheckbox = document.getElementById('toggleCurrent');
    const toggleVoltageCheckbox = document.getElementById('toggleVoltage');
    const togglePowerCheckbox = document.getElementById('togglePower');

    toggleCurrentCheckbox.addEventListener('change', () => {
        showCurrent = toggleCurrentCheckbox.checked;
    });

    toggleVoltageCheckbox.addEventListener('change', () => {
        showVoltage = toggleVoltageCheckbox.checked;
    });

    togglePowerCheckbox.addEventListener('change', () => {
        showPower = togglePowerCheckbox.checked;
    });
});

// Expose functions to global scope
window.resetSimulation = resetSimulation;
window.updateOscilloscopeParameters = updateOscilloscopeParameters;
