// ASTROLUNA Premium - Modelo Híbrido LSTM-XGBoost
async function runLSTMXGBoostModel(data, lstmResults, xgboostResults) {
    console.log('=== INICIANDO MODELO LSTM-XGBOOST ===');
    console.log('LSTM Results recibidos:', lstmResults ? lstmResults.length : 0);
    console.log('XGBoost Results recibidos:', xgboostResults ? xgboostResults.length : 0);
    
    const { trainData, testData, futureDates, targetVariable } = data;

    // --- 1. Hybrid Prediction Logic (LSTM + XGBoost) ---
    function predictHybrid(item, lstmValue = null, xgboostValue = null) {
        let score = 0;
        let featureCount = 0;
        
        // XGBoost-style feature aggregation with LSTM temporal awareness
        const temporalWeights = [0.5, 0.3, 0.15, 0.05]; // Temporal importance decay
        let weightIndex = 0;
        
        for (const key in item) {
            if (key !== 'date' && key !== targetVariable && typeof item[key] === 'number') {
                const featureValue = item[key];
                const temporalWeight = temporalWeights[weightIndex % temporalWeights.length] || 0.02;
                
                // XGBoost-style tree splitting simulation
                let treeValue = featureValue;
                if (featureValue > 60) {
                    treeValue += 5;
                } else if (featureValue > 30) {
                    treeValue += 2;
                } else {
                    treeValue -= 1;
                }
                
                // LSTM-style sequential memory
                const memoryComponent = Math.sigmoid(featureValue / 100) * 10;
                
                score += (treeValue + memoryComponent) * temporalWeight;
                featureCount++;
                weightIndex++;
            }
        }
        
        let hybridPrediction = featureCount > 0 ? score / featureCount : 50;
        
        // Apply LSTM sequential learning
        if (lstmValue !== null && !isNaN(lstmValue)) {
            hybridPrediction = (hybridPrediction * 0.35) + (lstmValue * 0.65); // 65% LSTM weight
        }
        
        // Apply XGBoost tree ensemble patterns
        if (xgboostValue !== null && !isNaN(xgboostValue)) {
            hybridPrediction = (hybridPrediction * 0.65) + (xgboostValue * 0.35); // 35% XGBoost weight
        }
        
        // XGBoost-style regularization with LSTM smoothing
        const l1_penalty = 0.01;
        const l2_penalty = 0.005;
        hybridPrediction = hybridPrediction * (1 - l1_penalty - l2_penalty);
        
        // LSTM-style output gate activation
        const outputGate = Math.sigmoid(hybridPrediction / 50);
        hybridPrediction = hybridPrediction * outputGate + (50 * (1 - outputGate));
        
        return Math.max(10, Math.min(99, Math.round(hybridPrediction)));
    }

    const validationPredictions = testData.map((item, index) => {
        // Get corresponding LSTM and XGBoost predictions
        const lstmPred = lstmResults && lstmResults[index] ? lstmResults[index].predicted : null;
        const xgboostPred = xgboostResults && xgboostResults[index] ? xgboostResults[index].predicted : null;
        
        const prediction = predictHybrid(item, lstmPred, xgboostPred);
        
        return {
            date: item.date,
            actual: item[targetVariable],
            predicted: prediction
        };
    });

    // --- 2. Future Forecasts with LSTM-XGBoost Hybrid Logic ---
    const fullHistory = [...trainData, ...validationPredictions.map(p => ({ [targetVariable]: p.predicted, date: p.date }))];
    
    // XGBoost ensemble with LSTM temporal patterns
    function predictFutureHybrid(history, futureIndex) {
        const sequenceLength = Math.min(8, history.length);
        const recentSequence = history.slice(-sequenceLength);
        
        // Base prediction using XGBoost-style tree ensemble
        let ensemblePrediction = 0;
        const numTrees = 7; // XGBoost typically uses many trees
        
        for (let tree = 0; tree < numTrees; tree++) {
            let treePrediction = 50; // Base value
            
            recentSequence.forEach((item, i) => {
                const value = item[targetVariable] || 50;
                const recency = (i + 1) / sequenceLength; // More recent = higher weight
                
                // Tree-based decision rules (XGBoost style)
                if (value > 70) {
                    treePrediction += 3 * recency;
                } else if (value > 50) {
                    treePrediction += 1 * recency;
                } else if (value < 30) {
                    treePrediction -= 2 * recency;
                } else {
                    treePrediction -= 0.5 * recency;
                }
                
                // LSTM-style forget gate simulation
                const forgetGate = Math.sigmoid((value - 50) / 20);
                treePrediction = treePrediction * forgetGate + value * (1 - forgetGate);
            });
            
            ensemblePrediction += treePrediction / numTrees;
        }
        
        // LSTM-style sequence learning for trend
        let sequenceTrend = 0;
        if (recentSequence.length >= 3) {
            for (let i = 2; i < recentSequence.length; i++) {
                const curr = recentSequence[i][targetVariable] || 50;
                const prev = recentSequence[i-1][targetVariable] || 50;
                const prevPrev = recentSequence[i-2][targetVariable] || 50;
                
                // LSTM-style trend analysis
                const shortTrend = curr - prev;
                const longTrend = prev - prevPrev;
                const momentum = (shortTrend + longTrend * 0.5) / 1.5;
                
                sequenceTrend += momentum;
            }
            sequenceTrend = sequenceTrend / (recentSequence.length - 2);
        }
        
        // Apply trend with future dampening
        const trendDampening = Math.exp(-futureIndex * 0.08);
        ensemblePrediction += sequenceTrend * trendDampening;
        
        // XGBoost-style early stopping equivalent (stability check)
        const stability = Math.abs(sequenceTrend) < 5 ? 1.0 : 0.9;
        ensemblePrediction *= stability;
        
        return Math.max(10, Math.min(99, Math.round(ensemblePrediction)));
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

    console.log('LSTM-XGBoost Hybrid completado:', validationPredictions.length + futurePredictions.length, 'predicciones');
    return [...validationPredictions, ...futurePredictions];
}

// Helper function for sigmoid activation
Math.sigmoid = Math.sigmoid || function(x) {
    return 1 / (1 + Math.exp(-x));
};

window.updateLSTMXGBoostResults = function(results, modelData) {
    console.log('=== ACTUALIZANDO RESULTADOS LSTM-XGBOOST ===');
    console.log('Results:', results);
    console.log('Results length:', results ? results.length : 0);
    
    const tableBody = document.querySelector('#lstmXgboostResults tbody');
    console.log('LSTM-XGBoost table body element:', tableBody);
    
    if (!tableBody) {
        console.error('No se encontró el elemento tbody de la tabla LSTM-XGBoost');
        return;
    }
    
    if (!results || results.length === 0) {
        console.warn('No hay resultados LSTM-XGBoost para mostrar');
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-red-500">No hay resultados disponibles</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('Procesando', results.length, 'resultados LSTM-XGBoost');
    
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
    
    console.log('✅ Tabla LSTM-XGBoost actualizada con', results.length, 'filas');
    
    // Update error metrics
    const testResults = results.filter(r => r.actual !== null);
    if (testResults.length > 0) {
        const mse = calculateMSE(testResults);
        const mae = calculateMAE(testResults);
        const rmse = Math.sqrt(mse);
        
        document.getElementById('lstm-xgboost-mse').textContent = mse.toFixed(4);
        document.getElementById('lstm-xgboost-mae').textContent = mae.toFixed(4);
        document.getElementById('lstm-xgboost-rmse').textContent = rmse.toFixed(4);
    }
    
    // Update chart
    const recentResults = results.slice(-30);
    
    if (typeof window.lstmXgboostChart !== 'undefined' && window.lstmXgboostChart !== null) {
        try {
            window.lstmXgboostChart.destroy();
        } catch (error) {
            console.warn('Error destroying LSTM-XGBoost chart:', error);
        }
    }
    
    const ctx = document.getElementById('lstmXgboostChart');
    if (!ctx) {
        console.error('No se encontró el canvas lstmXgboostChart');
        return;
    }
    
    try {
        window.lstmXgboostChart = new Chart(ctx.getContext('2d'), {
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
                        label: 'Predicciones LSTM-XGBoost',
                        data: recentResults.map(r => r.predicted),
                        borderColor: 'rgb(168, 85, 247)',
                        backgroundColor: 'rgba(168, 85, 247, 0.2)',
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
                        text: 'Pronóstico LSTM-XGBoost vs Valores Actuales'
                    }
                }
            }
        });
    } catch (chartError) {
        console.error('Error creando gráfico LSTM-XGBoost:', chartError);
    }
    
    // Update forecast cards
    const forecastContainer = document.getElementById('lstm-xgboost-forecast');
    if (forecastContainer) {
        forecastContainer.innerHTML = '';
        
        const futurePredictions = results.filter(r => r.date > today).slice(0, 7);
        futurePredictions.forEach(prediction => {
            const forecastCard = document.createElement('div');
            forecastCard.className = 'prediction-card bg-purple-100 shadow';
            
            const roundedValue = Math.round(prediction.predicted);
            
            forecastCard.innerHTML = `
                <p class="text-sm font-semibold">${prediction.date.toLocaleDateString('es-ES')}</p>
                <p class="text-2xl font-bold text-center text-purple-700">${roundedValue}</p>
            `;
            
            forecastContainer.appendChild(forecastCard);
        });
    }
}
