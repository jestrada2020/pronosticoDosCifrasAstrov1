// ASTROLUNA Premium - Modelo Híbrido LSTM-Neural Network
async function runLSTMNeuralNetworkModel(data, lstmResults, neuralNetResults) {
    console.log('=== INICIANDO MODELO LSTM-NEURAL NETWORK ===');
    console.log('LSTM Results recibidos:', lstmResults ? lstmResults.length : 0);
    console.log('Neural Network Results recibidos:', neuralNetResults ? neuralNetResults.length : 0);
    
    const { trainData, testData, futureDates, targetVariable } = data;

    // --- 1. Hybrid Prediction Logic (LSTM + Neural Network) ---
    function predictHybrid(item, lstmValue = null, neuralNetValue = null) {
        // Base prediction using features
        let score = 0;
        let featureCount = 0;
        
        // Enhanced feature processing with LSTM-style memory consideration
        const memoryWeights = [0.4, 0.3, 0.2, 0.1]; // Decreasing importance for older features
        let weightIndex = 0;
        
        for (const key in item) {
            if (key !== 'date' && key !== targetVariable && typeof item[key] === 'number') {
                const weight = memoryWeights[weightIndex % memoryWeights.length] || 0.05;
                score += item[key] * weight;
                featureCount++;
                weightIndex++;
            }
        }
        
        let hybridPrediction = featureCount > 0 ? score / featureCount : 50;
        
        // Apply LSTM temporal patterns if available
        if (lstmValue !== null && !isNaN(lstmValue)) {
            hybridPrediction = (hybridPrediction * 0.3) + (lstmValue * 0.7); // 70% LSTM weight
        }
        
        // Apply Neural Network pattern recognition if available
        if (neuralNetValue !== null && !isNaN(neuralNetValue)) {
            hybridPrediction = (hybridPrediction * 0.7) + (neuralNetValue * 0.3); // 30% NN weight
        }
        
        // LSTM-style activation function (tanh-like)
        const normalizedScore = Math.tanh(hybridPrediction / 50) * 50 + 50;
        
        return Math.max(10, Math.min(99, Math.round(normalizedScore)));
    }

    const validationPredictions = testData.map((item, index) => {
        // Get corresponding LSTM and Neural Network predictions
        const lstmPred = lstmResults && lstmResults[index] ? lstmResults[index].predicted : null;
        const neuralNetPred = neuralNetResults && neuralNetResults[index] ? neuralNetResults[index].predicted : null;
        
        const prediction = predictHybrid(item, lstmPred, neuralNetPred);
        
        return {
            date: item.date,
            actual: item[targetVariable],
            predicted: prediction
        };
    });

    // --- 2. Future Forecasts with LSTM-NN Hybrid Logic ---
    const fullHistory = [...trainData, ...validationPredictions.map(p => ({ [targetVariable]: p.predicted, date: p.date }))];
    
    // LSTM-style sequence processing for future predictions
    const sequenceLength = Math.min(7, fullHistory.length);
    
    function predictFutureHybrid(history, futureIndex) {
        const recentSequence = history.slice(-sequenceLength);
        
        // LSTM-style sequence weighting
        let sequenceScore = 0;
        let totalWeight = 0;
        
        recentSequence.forEach((item, i) => {
            const weight = Math.exp(i / sequenceLength); // Exponential weighting favoring recent values
            sequenceScore += (item[targetVariable] || 50) * weight;
            totalWeight += weight;
        });
        
        const baseSequencePred = totalWeight > 0 ? sequenceScore / totalWeight : 50;
        
        // Add trend component (Neural Network style)
        const trendValues = recentSequence.map(item => item[targetVariable] || 50);
        let trend = 0;
        if (trendValues.length >= 2) {
            for (let i = 1; i < trendValues.length; i++) {
                trend += trendValues[i] - trendValues[i-1];
            }
            trend = trend / (trendValues.length - 1);
        }
        
        // Apply trend with dampening for future predictions
        const dampening = Math.exp(-futureIndex * 0.1); // Reduce trend influence for distant predictions
        const futureValue = baseSequencePred + (trend * dampening);
        
        return Math.max(10, Math.min(99, Math.round(futureValue)));
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

    console.log('LSTM-NN Hybrid completado:', validationPredictions.length + futurePredictions.length, 'predicciones');
    return [...validationPredictions, ...futurePredictions];
}

window.updateLSTMNeuralNetworkResults = function(results, modelData) {
    console.log('=== ACTUALIZANDO RESULTADOS LSTM-NEURAL NETWORK ===');
    console.log('Results:', results);
    console.log('Results length:', results ? results.length : 0);
    
    const tableBody = document.querySelector('#lstmNnResults tbody');
    console.log('LSTM-NN table body element:', tableBody);
    
    if (!tableBody) {
        console.error('No se encontró el elemento tbody de la tabla LSTM-Neural Network');
        return;
    }
    
    if (!results || results.length === 0) {
        console.warn('No hay resultados LSTM-Neural Network para mostrar');
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-red-500">No hay resultados disponibles</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('Procesando', results.length, 'resultados LSTM-Neural Network');
    
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
    
    console.log('✅ Tabla LSTM-Neural Network actualizada con', results.length, 'filas');
    
    // Update error metrics
    const testResults = results.filter(r => r.actual !== null);
    if (testResults.length > 0) {
        const mse = calculateMSE(testResults);
        const mae = calculateMAE(testResults);
        const rmse = Math.sqrt(mse);
        
        document.getElementById('lstm-nn-mse').textContent = mse.toFixed(4);
        document.getElementById('lstm-nn-mae').textContent = mae.toFixed(4);
        document.getElementById('lstm-nn-rmse').textContent = rmse.toFixed(4);
    }
    
    // Update chart
    const recentResults = results.slice(-30);
    
    if (typeof window.lstmNnChart !== 'undefined' && window.lstmNnChart !== null) {
        try {
            window.lstmNnChart.destroy();
        } catch (error) {
            console.warn('Error destroying LSTM-NN chart:', error);
        }
    }
    
    const ctx = document.getElementById('lstmNnChart');
    if (!ctx) {
        console.error('No se encontró el canvas lstmNnChart');
        return;
    }
    
    try {
        window.lstmNnChart = new Chart(ctx.getContext('2d'), {
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
                        label: 'Predicciones LSTM-NN',
                        data: recentResults.map(r => r.predicted),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
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
                        text: 'Pronóstico LSTM-Neural Network vs Valores Actuales'
                    }
                }
            }
        });
    } catch (chartError) {
        console.error('Error creando gráfico LSTM-NN:', chartError);
    }
    
    // Update forecast cards
    const forecastContainer = document.getElementById('lstm-nn-forecast');
    if (forecastContainer) {
        forecastContainer.innerHTML = '';
        
        const futurePredictions = results.filter(r => r.date > today).slice(0, 7);
        futurePredictions.forEach(prediction => {
            const forecastCard = document.createElement('div');
            forecastCard.className = 'prediction-card bg-teal-100 shadow';
            
            const roundedValue = Math.round(prediction.predicted);
            
            forecastCard.innerHTML = `
                <p class="text-sm font-semibold">${prediction.date.toLocaleDateString('es-ES')}</p>
                <p class="text-2xl font-bold text-center text-teal-700">${roundedValue}</p>
            `;
            
            forecastContainer.appendChild(forecastCard);
        });
    }
}
