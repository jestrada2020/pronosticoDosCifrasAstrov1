// ASTROLUNA Premium - Modelo Híbrido
async function runHybridModel(data, lightgbmResults, iterations) {
    console.log('=== INICIANDO MODELO HÍBRIDO ===');
    console.log('LightGBM Results recibidos:', lightgbmResults ? lightgbmResults.length : 0);
    if (lightgbmResults && lightgbmResults.length > 0) {
        console.log('LightGBM sample:', lightgbmResults.slice(0, 2));
    }
    
    const { trainData, testData, futureDates, targetVariable } = data;

    // --- 1. Logic for Validation Predictions (Hybrid - combines multiple approaches) ---
    function predictFromFeatures(item, lightgbmValue = null) {
        let score = 0;
        let featureCount = 0;
        
        // Approach 1: Simple average (like XGBoost)
        for (const key in item) {
            if (key !== 'date' && key !== targetVariable && typeof item[key] === 'number') {
                score += item[key];
                featureCount++;
            }
        }
        const avgApproach = featureCount > 0 ? score / featureCount : 50;
        
        // Approach 2: Weighted features (like Neural Network)
        let weightedScore = 0;
        let weightIndex = 0;
        const weights = [0.4, 0.3, 0.2, 0.1];
        for (const key in item) {
            if (key !== 'date' && key !== targetVariable && typeof item[key] === 'number') {
                const weight = weights[weightIndex % weights.length] || 0.1;
                weightedScore += item[key] * weight;
                weightIndex++;
            }
        }
        
        // Hybrid combination
        let hybridScore = (avgApproach * 0.4) + (weightedScore * 0.6);
        
        // If we have LightGBM result, blend it in
        if (lightgbmValue !== null) {
            hybridScore = (hybridScore * 0.7) + (lightgbmValue * 0.3);
        }
        
        // Add realistic variation
        const noise = (Math.random() - 0.5) * 6;
        const hybridPrediction = Math.max(40, Math.min(99, Math.round(hybridScore + noise)));
        
        return hybridPrediction;
    }

    const validationPredictions = testData.map((item, index) => {
        // Try to get corresponding LightGBM result for this item
        const lightgbmResult = lightgbmResults && lightgbmResults[index] ? lightgbmResults[index].predicted : null;
        const prediction = predictFromFeatures(item, lightgbmResult);
        const actualValue = item[targetVariable];
        
        console.log(`Hybrid testData[${index}]:`, {
            item: item,
            targetVariable: targetVariable,
            actualValue: actualValue,
            actualType: typeof actualValue,
            prediction: prediction
        });
        
        // CRITICAL FIX: Ensure we get the correct value for the target variable
        let correctedActualValue = actualValue;
        
        console.log(`Hybrid - Procesando variable objetivo '${targetVariable}':`, {
            valorOriginal: actualValue,
            valorDirecto: item[targetVariable],
            esMismoValor: actualValue === item[targetVariable],
            todosLosCampos: Object.keys(item).filter(k => k !== 'date').map(k => `${k}:${item[k]}`).join(', ')
        });
        
        // Only consider it problematic if it's null, undefined, or clearly invalid
        if (actualValue === null || actualValue === undefined || isNaN(actualValue)) {
            console.warn(`⚠️ Hybrid: Valor problemático en ${targetVariable} (${actualValue}) para índice ${index}`);
            
            if (item[targetVariable] !== null && item[targetVariable] !== undefined && !isNaN(item[targetVariable])) {
                correctedActualValue = item[targetVariable];
                console.log(`✅ Hybrid: Usando valor directo de ${targetVariable}: ${correctedActualValue}`);
            } else {
                console.error(`❌ Hybrid: No se puede obtener valor válido de ${targetVariable}. Item completo:`, item);
                correctedActualValue = null;
            }
        } else {
            correctedActualValue = actualValue;
            console.log(`✅ Hybrid: Usando valor válido de ${targetVariable}: ${correctedActualValue}`);
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

window.updateHybridResults = function(results, modelData) {
    // Update table
    const tableBody = document.querySelector('#hybridResults tbody');
    tableBody.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    results.forEach(result => {
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = result.date.toLocaleDateString('es-ES');
        
        const predCell = document.createElement('td');
        predCell.textContent = result.predicted;
        
        const actualCell = document.createElement('td');
        actualCell.textContent = result.actual !== null ? result.actual.toFixed(2) : 'N/A';
        
        row.appendChild(dateCell);
        row.appendChild(predCell);
        row.appendChild(actualCell);
        
        // Highlight future predictions
        if (result.date > today) {
            row.classList.add('highlighted');
        }
        
        tableBody.appendChild(row);
    });
    
    // Update error metrics
    const testResults = results.filter(r => r.actual !== null);
    const mse = calculateMSE(testResults);
    const mae = calculateMAE(testResults);
    const rmse = Math.sqrt(mse);
    
    document.getElementById('hybrid-mse').textContent = mse.toFixed(4);
    document.getElementById('hybrid-mae').textContent = mae.toFixed(4);
    document.getElementById('hybrid-rmse').textContent = rmse.toFixed(4);
    
    // Update chart
    const recentResults = results.slice(-30); // Last 30 days
    
    if (hybridChart) {
        hybridChart.destroy();
    }
    
    const ctx = document.getElementById('hybridChart').getContext('2d');
    hybridChart = new Chart(ctx, {
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
                    label: 'Predicciones Modelo Híbrido',
                    data: recentResults.map(r => r.predicted),
                    borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
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
                    text: 'Pronóstico Modelo Híbrido vs Valores Actuales'
                }
            }
        }
    });
    
    // Update forecast cards
    const forecastContainer = document.getElementById('hybrid-forecast');
    forecastContainer.innerHTML = '';
    
    const futurePredictions = results.filter(r => r.date > today).slice(0, 7);
    futurePredictions.forEach(prediction => {
        const forecastCard = document.createElement('div');
        forecastCard.className = 'prediction-card bg-orange-100 shadow';
        
        // Round predicted value for better display
        const roundedValue = Math.round(prediction.predicted);
        
        forecastCard.innerHTML = `
            <p class="text-sm font-semibold">${prediction.date.toLocaleDateString('es-ES')}</p>
            <p class="text-2xl font-bold text-center text-orange-700">${roundedValue}</p>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}
