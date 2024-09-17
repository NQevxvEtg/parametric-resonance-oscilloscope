// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Define default values
    const DEFAULT_VALUES = {
        criticalPercentage: 45,           // %
        capacitance: 1e-6,                 // F
        inductanceBase: 0.2,               // H
        inductanceVariationPercent: 25,    // %
        modulationFrequency: 711.76,       // Hz
        resistance: 50.31                   // Ω
    };

    // Initialize parameters from default values
    let criticalPercentage = DEFAULT_VALUES.criticalPercentage;
    let capacitance = DEFAULT_VALUES.capacitance;
    let inductanceBase = DEFAULT_VALUES.inductanceBase;
    let inductanceVariationPercent = DEFAULT_VALUES.inductanceVariationPercent;
    let modulationFrequency = DEFAULT_VALUES.modulationFrequency;
    let resistance = DEFAULT_VALUES.resistance;

    // Define fixed limits
    const FIXED_LIMITS = {
        inductanceBase: { min: 0.000001, max: 1, step: 0.000001 },
        capacitance: { min: 0.000000001, max: 0.001, step: 0.000000001 },
        modulationFrequency: { min: 10, max: 10000, step: 1 },
        inductanceVariationPercent: { min: 0, max: 100, step: 0.1 },
        criticalPercentage: { min: 1, max: 100, step: 0.1 },
        resistance: { min: 1, max: 1000, step: 0.01 }
    };

    // Get elements
    const criticalPercentageInput = document.getElementById('criticalPercentage');
    const criticalPercentageValue = document.getElementById('criticalPercentageValue');
    const capacitanceInput = document.getElementById('capacitance');
    const capacitanceValue = document.getElementById('capacitanceValue');
    const inductanceBaseInput = document.getElementById('inductanceBase');
    const inductanceBaseValue = document.getElementById('inductanceBaseValue');
    const inductanceVariationPercentInput = document.getElementById('inductanceVariationPercent');
    const inductanceVariationPercentValue = document.getElementById('inductanceVariationPercentValue');
    const inductanceVariationValue = document.getElementById('inductanceVariationValue');
    const modulationFrequencyInput = document.getElementById('modulationFrequency');
    const modulationFrequencyValue = document.getElementById('modulationFrequencyValue');
    const resistanceInput = document.getElementById('resistance');
    const resistanceValue = document.getElementById('resistanceValue');
    const resetButton = document.getElementById('resetButton');

    let isUpdating = false; // Flag to prevent recursive updates

    // Function to format values with SI prefixes
    function formatSI(value, unit) {
        const prefixes = [
            { factor: 1e-12, symbol: 'p' },
            { factor: 1e-9, symbol: 'n' },
            { factor: 1e-6, symbol: 'μ' },
            { factor: 1e-3, symbol: 'm' },
            { factor: 1, symbol: '' },
            { factor: 1e3, symbol: 'k' },
            { factor: 1e6, symbol: 'M' },
            { factor: 1e9, symbol: 'G' },
            { factor: 1e12, symbol: 'T' },
        ];
        for (let i = 0; i < prefixes.length; i++) {
            if (value < prefixes[i].factor * 1000) {
                return (value / prefixes[i].factor).toFixed(3) + ' ' + prefixes[i].symbol + unit;
            }
        }
        return value.toExponential(3) + ' ' + unit;
    }

    // Function to update displayed values next to sliders
    function updateDisplayedValues() {
        criticalPercentageValue.textContent = criticalPercentage.toFixed(1) + '%';
        capacitanceValue.textContent = formatSI(capacitance, 'F');
        inductanceBaseValue.textContent = formatSI(inductanceBase, 'H');
        inductanceVariationPercentValue.textContent = inductanceVariationPercent.toFixed(1) + '%';

        // Calculate and display inductance variation value
        let deltaL = (inductanceVariationPercent / 100) * inductanceBase;
        inductanceVariationValue.textContent = 'Variation: ' + formatSI(deltaL, 'H');

        modulationFrequencyValue.textContent = modulationFrequency.toFixed(2) + ' Hz';
        resistanceValue.textContent = resistance.toFixed(2) + ' Ω';
    }

    // Function to set slider ranges and initial values
    function setSliderRanges() {
        // For each slider, set min, max, step, and initial value to default value
        Object.keys(FIXED_LIMITS).forEach(param => {
            const input = document.getElementById(param);
            if (input) {
                const { min, max, step } = FIXED_LIMITS[param];
                input.min = min;
                input.max = max;
                input.step = step;

                // Set to default value from DEFAULT_VALUES
                input.value = DEFAULT_VALUES[param];

                // Update corresponding variables to ensure synchronization
                switch (param) {
                    case 'criticalPercentage':
                        criticalPercentage = DEFAULT_VALUES.criticalPercentage;
                        break;
                    case 'capacitance':
                        capacitance = DEFAULT_VALUES.capacitance;
                        break;
                    case 'inductanceBase':
                        inductanceBase = DEFAULT_VALUES.inductanceBase;
                        break;
                    case 'inductanceVariationPercent':
                        inductanceVariationPercent = DEFAULT_VALUES.inductanceVariationPercent;
                        break;
                    case 'modulationFrequency':
                        modulationFrequency = DEFAULT_VALUES.modulationFrequency;
                        break;
                    case 'resistance':
                        resistance = DEFAULT_VALUES.resistance;
                        break;
                }
            }
        });
    }

    // Function to calculate dependent parameters
    function calculateParameters(changedParameter) {
        if (isUpdating) return;
        isUpdating = true;

        // Calculate omega_p and omega_0
        let omega_p = 2 * Math.PI * modulationFrequency;
        let omega_0 = omega_p / 2;

        // Enforce resonance condition
        if (changedParameter === 'modulationFrequency') {
            // Adjust capacitance to maintain resonance: omega_0 = 1 / sqrt(L0 * C)
            capacitance = 1 / (Math.pow(omega_0, 2) * inductanceBase);
            capacitance = Math.min(Math.max(capacitance, FIXED_LIMITS.capacitance.min), FIXED_LIMITS.capacitance.max);
            capacitanceInput.value = capacitance;
            console.log(`Adjusted Capacitance to maintain resonance: ${capacitance}`);
        } else if (changedParameter === 'inductanceBase') {
            // Adjust capacitance to maintain resonance
            capacitance = 1 / (Math.pow(omega_0, 2) * inductanceBase);
            capacitance = Math.min(Math.max(capacitance, FIXED_LIMITS.capacitance.min), FIXED_LIMITS.capacitance.max);
            capacitanceInput.value = capacitance;
            console.log(`Adjusted Capacitance to maintain resonance: ${capacitance}`);
        } else if (changedParameter === 'capacitance') {
            // Adjust modulation frequency to maintain resonance
            omega_0 = 1 / Math.sqrt(inductanceBase * capacitance);
            modulationFrequency = omega_0 / Math.PI;
            modulationFrequency = Math.min(Math.max(modulationFrequency, FIXED_LIMITS.modulationFrequency.min), FIXED_LIMITS.modulationFrequency.max);
            modulationFrequencyInput.value = modulationFrequency;
            omega_p = 2 * Math.PI * modulationFrequency;
            console.log(`Adjusted Modulation Frequency to maintain resonance: ${modulationFrequency}`);
        }

        // Recalculate deltaL and criticalResistance
        let deltaL = (inductanceVariationPercent / 100) * inductanceBase;
        let criticalResistance = (deltaL * omega_p) / 2;
        criticalResistance = Math.max(criticalResistance, FIXED_LIMITS.resistance.min);
        console.log(`Calculated Critical Resistance: ${criticalResistance}`);

        // Adjust criticalPercentage based on resistance
        if (changedParameter === 'resistance') {
            criticalPercentage = (resistance / criticalResistance) * 100;
            criticalPercentage = Math.min(criticalPercentage, FIXED_LIMITS.criticalPercentage.max);
            criticalPercentageInput.value = criticalPercentage;
            console.log(`Adjusted Critical Percentage based on Resistance: ${criticalPercentage}%`);
        } else if (changedParameter === 'criticalPercentage') {
            resistance = (criticalPercentage / 100) * criticalResistance;
            resistance = Math.min(Math.max(resistance, FIXED_LIMITS.resistance.min), FIXED_LIMITS.resistance.max);
            resistanceInput.value = resistance;
            console.log(`Adjusted Resistance based on Critical Percentage: ${resistance} Ω`);
        }

        // Update displayed values
        updateDisplayedValues();

        // Update oscilloscope parameters
        updateOscilloscopeParameters({
            inductanceBase,
            inductanceVariationPercent,
            omega_p,
            capacitance,
            resistance,
            dt: 0.0001, // Time step for simulation
            maxDataPoints: 800
        });

        isUpdating = false;
    }

    // Function to update the oscilloscope parameters
    function updateOscilloscopeParameters(params) {
        console.log('Calling updateOscilloscopeParameters with:', params);
        if (typeof window.updateOscilloscopeParameters === 'function') {
            window.updateOscilloscopeParameters(params);
        } else {
            console.error('updateOscilloscopeParameters function is not defined.');
        }
    }

    // Initialize sliders and set their ranges
    setSliderRanges();
    updateDisplayedValues();
    calculateParameters(); // Initial calculation to set dependencies

    // Event listeners for sliders
    modulationFrequencyInput.addEventListener('input', () => {
        if (isUpdating) return;
        modulationFrequency = parseFloat(modulationFrequencyInput.value);
        console.log('Modulation Frequency changed to:', modulationFrequency);
        calculateParameters('modulationFrequency');
    });

    inductanceBaseInput.addEventListener('input', () => {
        if (isUpdating) return;
        inductanceBase = parseFloat(inductanceBaseInput.value);
        console.log('Inductance Base changed to:', inductanceBase);
        calculateParameters('inductanceBase');
    });

    criticalPercentageInput.addEventListener('input', () => {
        if (isUpdating) return;
        criticalPercentage = parseFloat(criticalPercentageInput.value);
        console.log('Critical Percentage changed to:', criticalPercentage);
        calculateParameters('criticalPercentage');
    });

    resistanceInput.addEventListener('input', () => {
        if (isUpdating) return;
        resistance = parseFloat(resistanceInput.value);
        console.log('Resistance changed to:', resistance);
        calculateParameters('resistance');
    });

    inductanceVariationPercentInput.addEventListener('input', () => {
        if (isUpdating) return;
        inductanceVariationPercent = parseFloat(inductanceVariationPercentInput.value);
        console.log('Inductance Variation Percent changed to:', inductanceVariationPercent);
        calculateParameters(); // No specific parameter changed, recalculate dependencies
    });

    capacitanceInput.addEventListener('input', () => {
        if (isUpdating) return;
        capacitance = parseFloat(capacitanceInput.value);
        console.log('Capacitance changed to:', capacitance);
        calculateParameters('capacitance');
    });

    // Reset button event listener
    resetButton.addEventListener('click', () => {
        console.log('Resetting simulation to default values.');
        isUpdating = true; // Prevent event listeners from triggering during reset

        // Reset parameters to default values
        criticalPercentage = DEFAULT_VALUES.criticalPercentage;
        capacitance = DEFAULT_VALUES.capacitance;
        inductanceBase = DEFAULT_VALUES.inductanceBase;
        inductanceVariationPercent = DEFAULT_VALUES.inductanceVariationPercent;
        modulationFrequency = DEFAULT_VALUES.modulationFrequency;
        resistance = DEFAULT_VALUES.resistance;

        // Update slider values
        setSliderRanges();

        // Update displayed values
        updateDisplayedValues();

        // Recalculate parameters
        calculateParameters();

        isUpdating = false;

        // Reset oscilloscope simulation
        if (typeof window.resetSimulation === 'function') {
            window.resetSimulation();
        } else {
            console.error('resetSimulation function is not defined.');
        }
    });
});
