// ASTROLUNA Premium - Modelo de Redes Neuronales
async function runNeuralNetModel(data, iterations) {
    const { trainData, testData, futureDates, targetVariable } = data;

    // --- 1. Logic for Validation Predictions (Neural Network style - more complex) ---
    function predictFromFeatures(item) {
        let score = 0;
        let featureCount = 0;
        let weights = [0.3, 0.2, 0.15, 0.1, 0.1, 0.05]; // Different weights for features
        let weightIndex = 0;
        
        // Use weighted features approach (Neural Network style)
        for (const key in item) {
            if (key !== 'date' && key !== targetVariable && typeof item[key] === 'number') {
                const weight = weights[weightIndex % weights.length] || 0.1;
                score += item[key] * weight;
                featureCount++;
                weightIndex++;
            }
        }
        
        // Neural network activation function simulation (sigmoid-like)
        const normalizedScore = featureCount > 0 ? score : 50;
        
        // More realistic prediction close to feature values
        const sigmoidValue = 1 / (1 + Math.exp(-(normalizedScore - 50) / 20));
        const baseValue = normalizedScore * 0.7 + 50 * 0.3; // Blend with base value
        const noise = (Math.random() - 0.5) * 12; // Neural network uncertainty
        
        const neuralPrediction = Math.max(40, Math.min(99, Math.round(baseValue + noise)));
        
        return neuralPrediction;
    }

    const validationPredictions = testData.map((item, index) => {
        const prediction = predictFromFeatures(item);
        const actualValue = item[targetVariable];
        
        console.log(`NeuralNet testData[${index}]:`, {
            item: item,
            targetVariable: targetVariable,
            actualValue: actualValue,
            actualType: typeof actualValue,
            prediction: prediction
        });
        
        // CRITICAL FIX: Ensure we get the correct value for the target variable
        let correctedActualValue = actualValue;
        
        console.log(`NeuralNet - Procesando variable objetivo '${targetVariable}':`, {
            valorOriginal: actualValue,
            valorDirecto: item[targetVariable],
            esMismoValor: actualValue === item[targetVariable],
            todosLosCampos: Object.keys(item).filter(k => k !== 'date').map(k => `${k}:${item[k]}`).join(', ')
        });
        
        // Only consider it problematic if it's null, undefined, or clearly invalid
        if (actualValue === null || actualValue === undefined || isNaN(actualValue)) {
            console.warn(`⚠️ NeuralNet: Valor problemático en ${targetVariable} (${actualValue}) para índice ${index}`);
            
            if (item[targetVariable] !== null && item[targetVariable] !== undefined && !isNaN(item[targetVariable])) {
                correctedActualValue = item[targetVariable];
                console.log(`✅ NeuralNet: Usando valor directo de ${targetVariable}: ${correctedActualValue}`);
            } else {
                console.error(`❌ NeuralNet: No se puede obtener valor válido de ${targetVariable}. Item completo:`, item);
                correctedActualValue = null;
            }
        } else {
            correctedActualValue = actualValue;
            console.log(`✅ NeuralNet: Usando valor válido de ${targetVariable}: ${correctedActualValue}`);
        }
        
        return {
            date: item.date,
            actual: correctedActualValue,
            predicted: prediction
        };
    });

    // --- 2. Logic for Future Forecasts (based on history) ---
    const fullHistory = [...trainData, ...validationPredictions.map(p => ({ [targetVariable]: p.predicted, date: p.date }))];
    
    const windowSize = 7;
    const weights = Array.from({ length: windowSize }, (_, i) => i + 1);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    function predictWithHistory(history) {
        if (history.length < windowSize) {
            return history.length > 0 ? history[history.length - 1][targetVariable] : 10;
        }
        const window = history.slice(-windowSize);
        const weightedSum = window.reduce((sum, item, index) => {
            const value = item[targetVariable] || 0;
            return sum + value * weights[index];
        }, 0);
        return weightedSum / totalWeight;
    }

    const futurePredictions = [];
    let forecastHistory = [...fullHistory];

    for (const date of futureDates) {
        const rawPrediction = predictWithHistory(forecastHistory);
        const twoDigitPrediction = (Math.round(rawPrediction) % 90) + 10;
        futurePredictions.push({
            date: date,
            actual: null,
            predicted: twoDigitPrediction
        });
        // Add the new forecast to the history for the next step
        forecastHistory.push({ date: date, [targetVariable]: twoDigitPrediction });
    }

    return [...validationPredictions, ...futurePredictions];
}

window.updateNeuralNetResults = function(results, modelData) {
    console.log('=== ACTUALIZANDO RESULTADOS NEURAL NETWORK ===');
    console.log('Results:', results);
    console.log('Results length:', results ? results.length : 0);
    
    // Update table
    const tableBody = document.querySelector('#neuralnetResults tbody');
    console.log('Neural Net table body element:', tableBody);
    
    if (!tableBody) {
        console.error('No se encontró el elemento tbody de la tabla Neural Network');
        return;
    }
    
    if (!results || results.length === 0) {
        console.warn('No hay resultados Neural Network para mostrar');
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-red-500">No hay resultados disponibles</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('Procesando', results.length, 'resultados Neural Network');
    
    results.forEach(result => {
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
        
        // Highlight future predictions
        if (result.date && result.date > today) {
            row.classList.add('highlighted');
        }
        
        tableBody.appendChild(row);
    });
    
    console.log('✅ Tabla Neural Network actualizada con', results.length, 'filas');
    
    // Update error metrics
    const testResults = results.filter(r => r.actual !== null);
    const mse = calculateMSE(testResults);
    const mae = calculateMAE(testResults);
    const rmse = Math.sqrt(mse);
    
    document.getElementById('neuralnet-mse').textContent = mse.toFixed(4);
    document.getElementById('neuralnet-mae').textContent = mae.toFixed(4);
    document.getElementById('neuralnet-rmse').textContent = rmse.toFixed(4);
    
    // Update chart
    const recentResults = results.slice(-30); // Last 30 days
    
    if (neuralnetChart) {
        neuralnetChart.destroy();
    }
    
    const ctx = document.getElementById('neuralnetChart').getContext('2d');
    neuralnetChart = new Chart(ctx, {
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
                    label: 'Predicciones Red Neuronal',
                    data: recentResults.map(r => r.predicted),
                    borderColor: 'rgb(153, 102, 255)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
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
                    text: 'Pronóstico Red Neuronal vs Valores Actuales'
                }
            }
        }
    });
    
    // Update forecast cards
    const forecastContainer = document.getElementById('neuralnet-forecast');
    forecastContainer.innerHTML = '';
    
    const futurePredictions = results.filter(r => r.date > today).slice(0, 7);
    futurePredictions.forEach(prediction => {
        const forecastCard = document.createElement('div');
        forecastCard.className = 'prediction-card bg-purple-100 shadow';
        
        // Round predicted value for better display
        const roundedValue = Math.round(prediction.predicted);
        
        forecastCard.innerHTML = `
            <p class="text-sm font-semibold">${prediction.date.toLocaleDateString('es-ES')}</p>
            <p class="text-2xl font-bold text-center text-purple-700">${roundedValue}</p>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}
