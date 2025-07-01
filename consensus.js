// ASTROLUNA Premium - Modelo de Consenso
function calculateConsensus(xgboostResults, lightgbmResults, neuralNetResults, lstmResults, hybridResults, hybridLGBMNNResults, hybridLGBMLSTMResults, bayesianResults) {
    console.log('Iniciando cálculo de consenso...');
    console.log('Datos recibidos:', {
        xgboost: xgboostResults ? (Array.isArray(xgboostResults) ? xgboostResults.length : 'not array') : 'null',
        lightgbm: lightgbmResults ? (Array.isArray(lightgbmResults) ? lightgbmResults.length : 'not array') : 'null',
        neuralnet: neuralNetResults ? (Array.isArray(neuralNetResults) ? neuralNetResults.length : 'not array') : 'null',
        lstm: lstmResults ? (Array.isArray(lstmResults) ? lstmResults.length : 'not array') : 'null',
        hybrid: hybridResults ? (Array.isArray(hybridResults) ? hybridResults.length : 'not array') : 'null',
        hybridLGBMNN: hybridLGBMNNResults ? (Array.isArray(hybridLGBMNNResults) ? hybridLGBMNNResults.length : 'not array') : 'null',
        hybridLGBMLSTM: hybridLGBMLSTMResults ? (Array.isArray(hybridLGBMLSTMResults) ? hybridLGBMLSTMResults.length : 'not array') : 'null',
        bayesian: bayesianResults ? (Array.isArray(bayesianResults) ? bayesianResults.length : 'not array') : 'null'
    });
    
    // Validar que todos los parámetros sean arrays
    const validResults = {
        xgboost: Array.isArray(xgboostResults) ? xgboostResults : [],
        lightgbm: Array.isArray(lightgbmResults) ? lightgbmResults : [],
        neuralnet: Array.isArray(neuralNetResults) ? neuralNetResults : [],
        lstm: Array.isArray(lstmResults) ? lstmResults : [],
        hybrid: Array.isArray(hybridResults) ? hybridResults : [],
        hybridLGBMNN: Array.isArray(hybridLGBMNNResults) ? hybridLGBMNNResults : [],
        hybridLGBMLSTM: Array.isArray(hybridLGBMLSTMResults) ? hybridLGBMLSTMResults : [],
        bayesian: Array.isArray(bayesianResults) ? bayesianResults : []
    };
    
    console.log('Validación de resultados para consenso:', {
        xgboost: validResults.xgboost.length,
        lightgbm: validResults.lightgbm.length,
        neuralnet: validResults.neuralnet.length,
        lstm: validResults.lstm.length,
        hybrid: validResults.hybrid.length,
        hybridLGBMNN: validResults.hybridLGBMNN.length,
        hybridLGBMLSTM: validResults.hybridLGBMLSTM.length,
        bayesian: validResults.bayesian.length
    });
    
    // Create a map of all dates from all models
    const dateMap = new Map();
    
    // Add all dates from all models
    const allResults = [
        ...validResults.xgboost,
        ...validResults.lightgbm,
        ...validResults.neuralnet,
        ...validResults.lstm,
        ...validResults.hybrid,
        ...validResults.hybridLGBMNN,
        ...validResults.hybridLGBMLSTM,
        ...validResults.bayesian
    ];
    
    for (const result of allResults) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, {
                date: result.date,
                actual: result.actual,
                xgboost: null,
                lightgbm: null,
                neuralnet: null,
                lstm: null,
                hybrid: null,
                hybridLGBMNN: null,
                hybridLGBMLSTM: null,
                bayesian: null,
                consensus: null
            });
        }
    }
    
    // Fill in predictions from each model
    for (const result of validResults.xgboost) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).xgboost = result.predicted;
        }
    }
    
    for (const result of validResults.lightgbm) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).lightgbm = result.predicted;
        }
    }
    
    for (const result of validResults.neuralnet) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).neuralnet = result.predicted;
        }
    }
    
    for (const result of validResults.lstm) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).lstm = result.predicted;
        }
    }
    
    for (const result of validResults.hybrid) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).hybrid = result.predicted;
        }
    }
    
    for (const result of validResults.hybridLGBMNN) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).hybridLGBMNN = result.predicted;
        }
    }
    
    for (const result of validResults.hybridLGBMLSTM) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).hybridLGBMLSTM = result.predicted;
        }
    }
    
    for (const result of validResults.bayesian) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).bayesian = result.predicted;
        }
    }

    // Calculate consensus for each date
    const consensusResults = [];
    for (const [dateStr, entry] of dateMap) {
        const validPredictions = [];
        const weights = [];
        
        // Get default weights for available models (approximately 12.5% each for 8 models)
        if (entry.xgboost !== null && entry.xgboost !== undefined && !isNaN(entry.xgboost)) {
            validPredictions.push(entry.xgboost);
            weights.push(0.125);
        }
        
        if (entry.lightgbm !== null && entry.lightgbm !== undefined && !isNaN(entry.lightgbm)) {
            validPredictions.push(entry.lightgbm);
            weights.push(0.125);
        }
        
        if (entry.neuralnet !== null && entry.neuralnet !== undefined && !isNaN(entry.neuralnet)) {
            validPredictions.push(entry.neuralnet);
            weights.push(0.125);
        }
        
        if (entry.lstm !== null && entry.lstm !== undefined && !isNaN(entry.lstm)) {
            validPredictions.push(entry.lstm);
            weights.push(0.125);
        }
        
        if (entry.hybrid !== null && entry.hybrid !== undefined && !isNaN(entry.hybrid)) {
            validPredictions.push(entry.hybrid);
            weights.push(0.125);
        }
        
        if (entry.hybridLGBMNN !== null && entry.hybridLGBMNN !== undefined && !isNaN(entry.hybridLGBMNN)) {
            validPredictions.push(entry.hybridLGBMNN);
            weights.push(0.125);
        }
        
        if (entry.hybridLGBMLSTM !== null && entry.hybridLGBMLSTM !== undefined && !isNaN(entry.hybridLGBMLSTM)) {
            validPredictions.push(entry.hybridLGBMLSTM);
            weights.push(0.125);
        }
        
        if (entry.bayesian !== null && entry.bayesian !== undefined && !isNaN(entry.bayesian)) {
            validPredictions.push(entry.bayesian);
            weights.push(0.125);
        }
        
        // Only calculate consensus if we have at least one valid prediction
        if (validPredictions.length > 0) {
            // Normalize weights
            const totalWeight = weights.reduce((a, b) => a + b, 0);
            const normalizedWeights = weights.map(w => w / totalWeight);
            
            // Calculate weighted average
            const consensusPred = validPredictions.reduce((sum, pred, i) => 
                sum + pred * normalizedWeights[i], 0
            );
            
            entry.consensus = Math.max(10, Math.min(99, Math.round(consensusPred)));
            consensusResults.push({
                date: entry.date,
                actual: entry.actual,
                predicted: entry.consensus
            });
        } else {
            // If no valid predictions, use a fallback value
            entry.consensus = 50; // Valor neutral para DC (rango 10-99)
            consensusResults.push({
                date: entry.date,
                actual: entry.actual,
                predicted: entry.consensus
            });
        }
    }
    
    return consensusResults;
}

function recalculateConsensus(xgboostWeight, lightgbmWeight, neuralnetWeight, lstmWeight, hybridWeight, hybridLGBMNNWeight, hybridLGBMLSTMWeight, bayesianWeight) {
    // Update consensus predictions with new weights
    const updatedConsensus = [];
    
    // Get stored predictions
    const storedPredictions = window.storedConsensusData || [];
    
    for (const entry of storedPredictions) {
        const validPredictions = [];
        const weights = [];
        
        // Apply custom weights
        if (entry.xgboost !== null && entry.xgboost !== undefined && !isNaN(entry.xgboost)) {
            validPredictions.push(entry.xgboost);
            weights.push(xgboostWeight / 100);
        }
        
        if (entry.lightgbm !== null && entry.lightgbm !== undefined && !isNaN(entry.lightgbm)) {
            validPredictions.push(entry.lightgbm);
            weights.push(lightgbmWeight / 100);
        }
        
        if (entry.neuralnet !== null && entry.neuralnet !== undefined && !isNaN(entry.neuralnet)) {
            validPredictions.push(entry.neuralnet);
            weights.push(neuralnetWeight / 100);
        }
        
        if (entry.lstm !== null && entry.lstm !== undefined && !isNaN(entry.lstm)) {
            validPredictions.push(entry.lstm);
            weights.push(lstmWeight / 100);
        }
        
        if (entry.hybrid !== null && entry.hybrid !== undefined && !isNaN(entry.hybrid)) {
            validPredictions.push(entry.hybrid);
            weights.push(hybridWeight / 100);
        }
        
        if (entry.hybridLGBMNN !== null && entry.hybridLGBMNN !== undefined && !isNaN(entry.hybridLGBMNN)) {
            validPredictions.push(entry.hybridLGBMNN);
            weights.push(hybridLGBMNNWeight / 100);
        }
        
        if (entry.hybridLGBMLSTM !== null && entry.hybridLGBMLSTM !== undefined && !isNaN(entry.hybridLGBMLSTM)) {
            validPredictions.push(entry.hybridLGBMLSTM);
            weights.push(hybridLGBMLSTMWeight / 100);
        }
        
        if (entry.bayesian !== null && entry.bayesian !== undefined && !isNaN(entry.bayesian)) {
            validPredictions.push(entry.bayesian);
            weights.push(bayesianWeight / 100);
        }
        
        if (validPredictions.length > 0) {
            // Normalize weights
            const totalWeight = weights.reduce((a, b) => a + b, 0);
            const normalizedWeights = totalWeight > 0 ? weights.map(w => w / totalWeight) : weights.map(() => 1 / weights.length);
            
            // Calculate weighted average
            const consensusPred = validPredictions.reduce((sum, pred, i) => 
                sum + pred * normalizedWeights[i], 0
            );
            
            updatedConsensus.push({
                date: entry.date,
                actual: entry.actual,
                predicted: Math.max(10, Math.min(99, Math.round(consensusPred)))
            });
        } else {
            updatedConsensus.push({
                date: entry.date,
                actual: entry.actual,
                predicted: 50
            });
        }
    }
    
    return updatedConsensus;
}

function updateConsensusResults(results, xgboostResults, lightgbmResults, neuralNetResults, lstmResults, hybridResults, hybridLGBMNNResults, hybridLGBMLSTMResults, bayesianResults, modelData) {
    // Validar que todos los parámetros sean arrays
    const validResults = {
        xgboost: Array.isArray(xgboostResults) ? xgboostResults : [],
        lightgbm: Array.isArray(lightgbmResults) ? lightgbmResults : [],
        neuralnet: Array.isArray(neuralNetResults) ? neuralNetResults : [],
        lstm: Array.isArray(lstmResults) ? lstmResults : [],
        hybrid: Array.isArray(hybridResults) ? hybridResults : [],
        hybridLGBMNN: Array.isArray(hybridLGBMNNResults) ? hybridLGBMNNResults : [],
        hybridLGBMLSTM: Array.isArray(hybridLGBMLSTMResults) ? hybridLGBMLSTMResults : [],
        bayesian: Array.isArray(bayesianResults) ? bayesianResults : []
    };
    
    // Store data for recalculation
    const consensusData = [];
    const dateMap = new Map();
    
    // Create consolidated data structure
    const allResults = [
        ...validResults.xgboost,
        ...validResults.lightgbm,
        ...validResults.neuralnet,
        ...validResults.lstm,
        ...validResults.hybrid,
        ...validResults.hybridLGBMNN,
        ...validResults.hybridLGBMLSTM,
        ...validResults.bayesian
    ];
    
    for (const result of allResults) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, {
                date: result.date,
                actual: result.actual,
                xgboost: null,
                lightgbm: null,
                neuralnet: null,
                lstm: null,
                hybrid: null,
                hybridLGBMNN: null,
                hybridLGBMLSTM: null,
                bayesian: null
            });
        }
    }
    
    // Fill predictions
    for (const result of validResults.xgboost) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).xgboost = result.predicted;
        }
    }
    
    for (const result of validResults.lightgbm) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).lightgbm = result.predicted;
        }
    }
    
    for (const result of validResults.neuralnet) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).neuralnet = result.predicted;
        }
    }
    
    for (const result of validResults.lstm) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).lstm = result.predicted;
        }
    }
    
    for (const result of validResults.hybrid) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).hybrid = result.predicted;
        }
    }
    
    for (const result of validResults.hybridLGBMNN) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).hybridLGBMNN = result.predicted;
        }
    }
    
    for (const result of validResults.hybridLGBMLSTM) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).hybridLGBMLSTM = result.predicted;
        }
    }
    
    for (const result of validResults.bayesian) {
        const dateStr = result.date.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
            dateMap.get(dateStr).bayesian = result.predicted;
        }
    }

    // Convert to array
    for (const [dateStr, entry] of dateMap) {
        consensusData.push(entry);
    }
    
    window.storedConsensusData = consensusData;
    
    // Update table
    const tableBody = document.querySelector('#consensusResults tbody');
    tableBody.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    results.forEach(result => {
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = result.date.toLocaleDateString('es-ES');
        
        // Find corresponding predictions from each model
        const dateStr = result.date.toISOString().split('T')[0];
        const entry = consensusData.find(e => e.date.toISOString().split('T')[0] === dateStr);
        
        const xgboostCell = document.createElement('td');
        xgboostCell.textContent = (entry && entry.xgboost !== null && entry.xgboost !== undefined) ? entry.xgboost.toFixed(2) : 'N/A';
        
        const lightgbmCell = document.createElement('td');
        lightgbmCell.textContent = (entry && entry.lightgbm !== null && entry.lightgbm !== undefined) ? entry.lightgbm.toFixed(2) : 'N/A';
        
        const neuralnetCell = document.createElement('td');
        neuralnetCell.textContent = (entry && entry.neuralnet !== null && entry.neuralnet !== undefined) ? entry.neuralnet.toFixed(2) : 'N/A';
        
        const lstmCell = document.createElement('td');
        lstmCell.textContent = (entry && entry.lstm !== null && entry.lstm !== undefined) ? entry.lstm.toFixed(2) : 'N/A';
        
        const hybridCell = document.createElement('td');
        hybridCell.textContent = (entry && entry.hybrid !== null && entry.hybrid !== undefined) ? entry.hybrid.toFixed(2) : 'N/A';
        
        const hybridLGBMNNCell = document.createElement('td');
        hybridLGBMNNCell.textContent = (entry && entry.hybridLGBMNN !== null && entry.hybridLGBMNN !== undefined) ? entry.hybridLGBMNN.toFixed(2) : 'N/A';
        
        const hybridLGBMLSTMCell = document.createElement('td');
        hybridLGBMLSTMCell.textContent = (entry && entry.hybridLGBMLSTM !== null && entry.hybridLGBMLSTM !== undefined) ? entry.hybridLGBMLSTM.toFixed(2) : 'N/A';
        
        const consensusCell = document.createElement('td');
        consensusCell.textContent = result.predicted.toFixed(2);
        consensusCell.classList.add('font-semibold', 'text-indigo-700');
        
        const actualCell = document.createElement('td');
        actualCell.textContent = (result.actual !== null && result.actual !== undefined) ? result.actual.toFixed(2) : 'N/A';
        
        row.appendChild(dateCell);
        row.appendChild(xgboostCell);
        row.appendChild(lightgbmCell);
        row.appendChild(neuralnetCell);
        row.appendChild(lstmCell);
        row.appendChild(hybridCell);
        row.appendChild(hybridLGBMNNCell);
        row.appendChild(hybridLGBMLSTMCell);
        row.appendChild(consensusCell);
        row.appendChild(actualCell);
        
        // Highlight future predictions
        if (result.date > today) {
            row.classList.add('highlighted');
        }
        
        tableBody.appendChild(row);
    });
    
    // Update chart
    const recentResults = results.slice(-30);
    
    if (consensusChart) {
        consensusChart.destroy();
    }
    
    const ctx = document.getElementById('consensusChart').getContext('2d');
    consensusChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: recentResults.map(r => r.date.toLocaleDateString('es-ES')),
            datasets: [
                {
                    label: 'Valores Actuales',
                    data: recentResults.map(r => (r.actual !== null && r.actual !== undefined) ? r.actual : null),
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1,
                    spanGaps: true
                },
                {
                    label: 'Consenso',
                    data: recentResults.map(r => r.predicted),
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    tension: 0.1,
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 10,
                    max: 99,
                    title: {
                        display: true,
                        text: 'Valores DC (10-99)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Pronóstico Consensuado DC vs Valores Actuales'
                }
            }
        }
    });
    
    // Update forecast cards
    const forecastContainer = document.getElementById('consensus-forecast');
    forecastContainer.innerHTML = '';
    
    const futurePredictions = results.filter(r => r.date > today).slice(0, 7);
    futurePredictions.forEach(prediction => {
        const forecastCard = document.createElement('div');
        forecastCard.className = 'prediction-card bg-indigo-100 shadow';
        
        const roundedValue = Math.round(prediction.predicted);
        
        forecastCard.innerHTML = `
            <p class="text-sm font-semibold">${prediction.date.toLocaleDateString('es-ES')}</p>
            <p class="text-2xl font-bold text-center text-indigo-700">${roundedValue}</p>
            <p class="text-xs text-center text-gray-500">(${prediction.predicted.toFixed(2)})</p>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}

// Helper functions
function calculateMSE(results) {
    const validResults = results.filter(r => 
        r.actual !== null && r.actual !== undefined && 
        r.predicted !== null && r.predicted !== undefined &&
        !isNaN(r.actual) && !isNaN(r.predicted)
    );
    
    if (validResults.length === 0) return 0;
    
    const mse = validResults.reduce((sum, result) => {
        const error = result.actual - result.predicted;
        return sum + (error * error);
    }, 0) / validResults.length;
    
    return mse;
}

function calculateMAE(results) {
    const validResults = results.filter(r => 
        r.actual !== null && r.actual !== undefined && 
        r.predicted !== null && r.predicted !== undefined &&
        !isNaN(r.actual) && !isNaN(r.predicted)
    );
    
    if (validResults.length === 0) return 0;
    
    const mae = validResults.reduce((sum, result) => {
        return sum + Math.abs(result.actual - result.predicted);
    }, 0) / validResults.length;
    
    return mae;
}
