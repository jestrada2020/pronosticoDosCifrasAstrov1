// ASTROLUNA Premium - Modelo Híbrido LSTM-LightGBM
async function runLSTMLightGBMModel(data, lstmResults, lightgbmResults) {
    console.log('=== INICIANDO MODELO LSTM-LIGHTGBM ===');
    console.log('LSTM Results recibidos:', lstmResults ? lstmResults.length : 0);
    console.log('LightGBM Results recibidos:', lightgbmResults ? lightgbmResults.length : 0);
    
    const { trainData, testData, futureDates, targetVariable } = data;

    // --- 1. Hybrid Prediction Logic (LSTM + LightGBM) ---
    function predictHybrid(item, lstmValue = null, lightgbmValue = null) {
        let score = 0;
        let featureCount = 0;
        
        // LightGBM-style gradient boosting simulation with LSTM memory
        let boostingScore = 50; // Base prediction
        const learningRate = 0.15; // Slightly higher for hybrid model
        
        for (const key in item) {
            if (key !== 'date' && key !== targetVariable && typeof item[key] === 'number') {
                const featureValue = item[key];
                
                // Multiple weak learners (LightGBM style)
                const weakLearner1 = (featureValue > 50) ? 8 : -6;
                const weakLearner2 = (featureValue % 3 === 0) ? 4 : -2;
                const weakLearner3 = Math.sin(featureValue / 15) * 12;
                
                // LSTM-style memory component
                const memoryComponent = Math.tanh(featureValue / 30) * 5;
                
                boostingScore += (weakLearner1 + weakLearner2 + weakLearner3 + memoryComponent) * learningRate;
                featureCount++;
            }
        }
        
        let hybridPrediction = boostingScore;
        
        // Apply LSTM temporal sequence learning
        if (lstmValue !== null && !isNaN(lstmValue)) {
            hybridPrediction = (hybridPrediction * 0.4) + (lstmValue * 0.6); // 60% LSTM weight
        }
        
        // Apply LightGBM tree-based patterns
        if (lightgbmValue !== null && !isNaN(lightgbmValue)) {
            hybridPrediction = (hybridPrediction * 0.6) + (lightgbmValue * 0.4); // 40% LightGBM weight
        }
        
        // Regularization (LightGBM style)
        const l2_penalty = 0.01;
        hybridPrediction = hybridPrediction * (1 - l2_penalty);
        
        return Math.max(10, Math.min(99, Math.round(hybridPrediction)));
    }

    const validationPredictions = testData.map((item, index) => {
        // Get corresponding LSTM and LightGBM predictions
        const lstmPred = lstmResults && lstmResults[index] ? lstmResults[index].predicted : null;
        const lightgbmPred = lightgbmResults && lightgbmResults[index] ? lightgbmResults[index].predicted : null;
        
        const prediction = predictHybrid(item, lstmPred, lightgbmPred);
        
        return {
            date: item.date,
            actual: item[targetVariable],
            predicted: prediction
        };
    });

    // --- 2. Future Forecasts with LSTM-LightGBM Hybrid Logic ---
    const fullHistory = [...trainData, ...validationPredictions.map(p => ({ [targetVariable]: p.predicted, date: p.date }))];
    
    // Gradient boosting approach for future predictions
    function predictFutureHybrid(history, futureIndex) {
        const windowSize = Math.min(10, history.length);
        const recentWindow = history.slice(-windowSize);
        
        // Base prediction from recent history
        let baseValue = 50;
        if (recentWindow.length > 0) {
            baseValue = recentWindow.reduce((sum, item) => sum + (item[targetVariable] || 50), 0) / recentWindow.length;
        }
        
        // Gradient boosting trees simulation
        let boostedValue = baseValue;
        const numTrees = 5;
        
        for (let tree = 0; tree < numTrees; tree++) {
            // Each tree learns residual patterns
            let treeContribution = 0;
            
            recentWindow.forEach((item, i) => {
                const value = item[targetVariable] || 50;
                const weight = Math.exp(i / windowSize); // Recent values more important
                
                // Tree-like decision rules
                if (value > baseValue) {
                    treeContribution += 2 * weight;
                } else {
                    treeContribution -= 1 * weight;
                }
                
                // LSTM-style temporal pattern
                if (i > 0) {
                    const prevValue = recentWindow[i-1][targetVariable] || 50;
                    const momentum = (value - prevValue) * 0.1;
                    treeContribution += momentum * weight;
                }
            });
            
            boostedValue += treeContribution * 0.1; // Learning rate
        }
        
        // Add future decay (typical in time series)
        const decayFactor = Math.exp(-futureIndex * 0.05);
        boostedValue = baseValue + (boostedValue - baseValue) * decayFactor;
        
        return Math.max(10, Math.min(99, Math.round(boostedValue)));
    }

    const futurePredictions = [];
    let forecastHistory = [...fullHistory];

    futureDates.forEach((date, index) => {
        const prediction = predictFutureHybrid(forecastHistory, index);
        
        futurePredictions.push({
            date: date,
            actual: null,
            predicted: prediction
        });
        
        // Add prediction to history for next iteration
        forecastHistory.push({ date: date, [targetVariable]: prediction });
    });

    console.log('LSTM-LightGBM Hybrid completado:', validationPredictions.length + futurePredictions.length, 'predicciones');
    return [...validationPredictions, ...futurePredictions];
}

window.updateLSTMLightGBMResults = function(results, modelData) {
    console.log('=== ACTUALIZANDO RESULTADOS LSTM-LIGHTGBM ===');
    console.log('Results:', results);
    console.log('Results length:', results ? results.length : 0);
    
    const tableBody = document.querySelector('#lstmLightgbmResults tbody');
    console.log('LSTM-LightGBM table body element:', tableBody);
    
    if (!tableBody) {
        console.error('No se encontró el elemento tbody de la tabla LSTM-LightGBM');
        return;
    }
    
    if (!results || results.length === 0) {
        console.warn('No hay resultados LSTM-LightGBM para mostrar');
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-red-500">No hay resultados disponibles</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('Procesando', results.length, 'resultados LSTM-LightGBM');
    
    results.forEach((result, index) => {
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = result.date ? result.date.toLocaleDateString('es-ES') : 'N/A';
        
        const predCell = document.createElement('td');
        predCell.textContent = result.predicted !== undefined ? result.predicted : 'N/A';
        
        const actualCell = document.createElement('td');
        actualCell.textContent = result.actual !== null && result.actual !== undefined ? result.actual.toFixed(2) : 'N/A';
        
        row.appendChild(dateCell);
        row.appendChild(predCell);
        row.appendChild(actualCell);
        
        if (result.date && result.date > today) {
            row.classList.add('highlighted');
        }
        
        tableBody.appendChild(row);
    });
    
    console.log('✅ Tabla LSTM-LightGBM actualizada con', results.length, 'filas');
    
    // Update error metrics
    const testResults = results.filter(r => r.actual !== null);
    if (testResults.length > 0) {
        const mse = calculateMSE(testResults);
        const mae = calculateMAE(testResults);
        const rmse = Math.sqrt(mse);
        
        document.getElementById('lstm-lightgbm-mse').textContent = mse.toFixed(4);
        document.getElementById('lstm-lightgbm-mae').textContent = mae.toFixed(4);
        document.getElementById('lstm-lightgbm-rmse').textContent = rmse.toFixed(4);
    }
    
    // Update chart
    const recentResults = results.slice(-30);
    
    if (typeof window.lstmLightgbmChart !== 'undefined' && window.lstmLightgbmChart !== null) {
        try {
            window.lstmLightgbmChart.destroy();
        } catch (error) {
            console.warn('Error destroying LSTM-LightGBM chart:', error);
        }
    }
    
    const ctx = document.getElementById('lstmLightgbmChart');
    if (!ctx) {
        console.error('No se encontró el canvas lstmLightgbmChart');
        return;
    }
    
    try {
        window.lstmLightgbmChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: recentResults.map(r => r.date.toLocaleDateString('es-ES')),
                datasets: [
                    {
                        label: 'Valores Actuales',
                        data: recentResults.map(r => r.actual),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.1
                    },
                    {
                        label: 'Predicciones LSTM-LightGBM',
                        data: recentResults.map(r => r.predicted),
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Pronóstico LSTM-LightGBM vs Valores Actuales'
                    }
                }
            }
        });
    } catch (chartError) {
        console.error('Error creando gráfico LSTM-LightGBM:', chartError);
    }
    
    // Update forecast cards
    const forecastContainer = document.getElementById('lstm-lightgbm-forecast');
    if (forecastContainer) {
        forecastContainer.innerHTML = '';
        
        const futurePredictions = results.filter(r => r.date > today).slice(0, 7);
        futurePredictions.forEach(prediction => {
            const forecastCard = document.createElement('div');
            forecastCard.className = 'prediction-card bg-green-100 shadow';
            
            const roundedValue = Math.round(prediction.predicted);
            
            forecastCard.innerHTML = `
                <p class="text-sm font-semibold">${prediction.date.toLocaleDateString('es-ES')}</p>
                <p class="text-2xl font-bold text-center text-green-700">${roundedValue}</p>
            `;
            
            forecastContainer.appendChild(forecastCard);
        });
    }
}
