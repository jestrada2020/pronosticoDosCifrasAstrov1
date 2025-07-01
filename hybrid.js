// ASTROLUNA Premium - Modelo Híbrido (LSTM + Redes Neuronales)
async function runHybridModel(data, lstmResults, neuralNetResults, iterations) {
    console.log('Iniciando modelo híbrido LSTM + Redes Neuronales...');
    console.log('Parámetros:', { iterations });
    
    // Simular tiempo de entrenamiento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { trainData, testData, targetVariable, numericFeatures } = data;
    
    // Extraer valores objetivo para el análisis
    const trainTargets = trainData.map(row => row[targetVariable]);
    const testTargets = testData.map(row => row[targetVariable]);
    
    console.log('Modelo Híbrido LSTM+NN - Variable objetivo:', targetVariable);
    console.log('Modelo Híbrido LSTM+NN - Datos de entrenamiento:', trainTargets.length);
    console.log('Modelo Híbrido LSTM+NN - Datos de prueba:', testTargets.length);
    
    const predictions = testData.map((item, index) => {
        // Buscar predicciones correspondientes de LSTM y Redes Neuronales
        const lstmPred = lstmResults.find(p => 
            p.date.getTime() === item.date.getTime()
        )?.predicted;
        
        const nnPred = neuralNetResults.find(p => 
            p.date.getTime() === item.date.getTime()
        )?.predicted;
        
        // Valores de referencia para casos donde falten predicciones
        const recentMean = trainTargets.slice(-Math.min(7, trainTargets.length))
                                      .reduce((a, b) => a + b, 0) / Math.min(7, trainTargets.length);
        
        // Usar predicciones disponibles o fallback
        const lstmValue = (lstmPred !== undefined && !isNaN(lstmPred)) ? lstmPred : recentMean;
        const nnValue = (nnPred !== undefined && !isNaN(nnPred)) ? nnPred : recentMean;
        
        // Calcular factores de confianza basados en la variabilidad reciente
        const recentValues = trainTargets.slice(-Math.min(10, trainTargets.length));
        const variance = calculateVarianceFromValues(recentValues);
        
        // Pesos específicos por variable objetivo - diferentes variables requieren diferentes enfoques
        let lstmWeight, nnWeight;
        switch(targetVariable) {
            case 'DC':
                // DC: patrones más estables, mayor peso a LSTM para tendencias temporales
                lstmWeight = 0.7;
                nnWeight = 0.3;
                break;
            case 'EXT':
                // EXT: más volátil, balance entre temporal y no-lineal
                lstmWeight = 0.55;
                nnWeight = 0.45;
                break;
            case 'ULT2':
                // ULT2: patrones intermedios
                lstmWeight = 0.6;
                nnWeight = 0.4;
                break;
            case 'PM2':
                // PM2: muy complejo, mayor peso a redes neuronales para capturar no-linealidad
                lstmWeight = 0.45;
                nnWeight = 0.55;
                break;
            case 'C1C3':
                // C1C3: interacciones específicas, balance ligeramente hacia NN
                lstmWeight = 0.52;
                nnWeight = 0.48;
                break;
            case 'C2C4':
                // C2C4: patrones balanceados
                lstmWeight = 0.58;
                nnWeight = 0.42;
                break;
            default:
                lstmWeight = 0.6;
                nnWeight = 0.4;
        }
        
        // Ajustar pesos basado en volatilidad (mayor volatilidad favorece NN)
        const volatilityFactor = Math.min(variance, 3) / 3; // Normalizar varianza
        lstmWeight = lstmWeight * (1 - volatilityFactor * 0.2); // Reducir LSTM con volatilidad
        nnWeight = 1 - lstmWeight; // Compensar con NN
        
        // Combinar predicciones con pesos dinámicos específicos por variable
        const hybridPred = lstmValue * lstmWeight + nnValue * nnWeight;
        
        // Validar que no sea NaN
        const finalPrediction = isNaN(hybridPred) ? recentMean : hybridPred;
        
        return {
            date: item.date,
            actual: item[targetVariable],
            predicted: applyVariableLimits(finalPrediction, targetVariable)
        };
    });
    
    // Generar predicciones futuras
    const futurePredictions = data.futureDates.map((date, index) => {
        // Buscar predicciones futuras correspondientes
        const lstmFuturePred = lstmResults.find(p => 
            p.date.getTime() === date.getTime()
        )?.predicted;
        
        const nnFuturePred = neuralNetResults.find(p => 
            p.date.getTime() === date.getTime()
        )?.predicted;
        
        // Valores de referencia para predicciones futuras
        const allHistoricalValues = [...trainTargets, ...testTargets];
        const recentValues = allHistoricalValues.slice(-15);
        const avgRecent = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
        
        // Fallback si alguna predicción no está disponible
        if (lstmFuturePred === undefined || isNaN(lstmFuturePred) ||
            nnFuturePred === undefined || isNaN(nnFuturePred)) {
            
            // Usar método de ensemble simplificado
            const seasonalFactor = calculateAdvancedSeasonal(date, index);
            const trendFactor = calculateHybridTrend(recentValues);
            const prediction = avgRecent + seasonalFactor + trendFactor * (index + 1) * 0.1;
            
            return {
                date: date,
                actual: null,
                predicted: applyVariableLimits(prediction, targetVariable)
            };
        }
        
        // Combinación inteligente para predicciones futuras
        // LSTM mejor para predicciones a corto plazo, NN mejor para largo plazo
        const timeHorizon = index + 1;
        const timeFactor = Math.min(timeHorizon / 7, 1); // Normalizar a una semana
        
        const lstmWeight = 0.8 - timeFactor * 0.3; // Decrece de 80% a 50%
        const nnWeight = 1 - lstmWeight; // Aumenta de 20% a 50%
        
        const hybridFuturePred = lstmFuturePred * lstmWeight + nnFuturePred * nnWeight;
        
        // Validar que no sea NaN
        const finalPrediction = isNaN(hybridFuturePred) ? avgRecent : hybridFuturePred;
        
        return {
            date: date,
            actual: null,
            predicted: applyVariableLimits(finalPrediction, targetVariable)
        };
    });
    
    const allPredictions = [...predictions, ...futurePredictions];
    console.log('Modelo Híbrido LSTM+NN completado. Predicciones generadas:', allPredictions.length);
    
    return allPredictions;
}

function calculateVarianceFromValues(values) {
    if (values.length < 2) return 1;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.max(0.1, variance);
}

function calculateAdvancedSeasonal(date, timeIndex) {
    // Factor estacional avanzado que combina múltiples ciclos
    const month = date.getMonth();
    const day = date.getDate();
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Ciclo anual (zodiacal)
    const annualFactor = Math.sin((dayOfYear / 365.25) * 2 * Math.PI) * 0.4;
    
    // Ciclo mensual
    const monthlyFactor = Math.cos((month + 1) * Math.PI / 6) * 0.2;
    
    // Ciclo quincenal (lunaciones aproximadas)
    const lunarFactor = Math.sin((day / 15) * Math.PI) * 0.15;
    
    // Factor de proyección temporal (disminuye con la distancia)
    const projectionFactor = Math.exp(-timeIndex * 0.1);
    
    return (annualFactor + monthlyFactor + lunarFactor) * projectionFactor;
}

function calculateHybridTrend(values) {
    if (values.length < 2) return 0;
    
    // Cálculo de tendencia ponderada
    const weights = values.map((_, i) => i + 1); // Pesos lineales crecientes
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    let weightedSum = 0;
    values.forEach((value, i) => {
        weightedSum += value * weights[i];
    });
    
    const weightedMean = weightedSum / totalWeight;
    const simpleMean = values.reduce((a, b) => a + b, 0) / values.length;
    
    return (weightedMean - simpleMean) * 0.5;
}

function calculateHybridSeasonal(date) {
    // Factor estacional específico para modelo híbrido
    const month = date.getMonth();
    const day = date.getDate();
    
    // Ciclo mensual
    const monthlyFactor = Math.sin((month + 1) * Math.PI / 6) * 0.3;
    
    // Ciclo semanal (aproximado)
    const weeklyFactor = Math.cos(day * Math.PI / 15) * 0.1;
    
    return monthlyFactor + weeklyFactor;
}

function updateHybridResults(results, modelData) {
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
        predCell.textContent = result.predicted.toFixed(2);
        
        const actualCell = document.createElement('td');
        actualCell.textContent = (result.actual !== null && result.actual !== undefined) ? result.actual.toFixed(2) : 'N/A';
        
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
    const testResults = results.filter(r => r.actual !== null && r.actual !== undefined && !isNaN(r.actual));
    const mse = testResults.length > 0 ? calculateMSE(testResults) : 0;
    const mae = testResults.length > 0 ? calculateMAE(testResults) : 0;
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
            <p class="text-xs text-center text-gray-500">(${prediction.predicted.toFixed(2)})</p>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}

function calculateLSTMConfidence(prediction, recentValues) {
    // Calcular confianza de LSTM basada en consistencia temporal
    if (recentValues.length < 2) return 0.5;
    
    const recentMean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const deviation = Math.abs(prediction - recentMean);
    const maxDeviation = Math.max(...recentValues.map(v => Math.abs(v - recentMean)));
    
    // Confianza inversamente proporcional a la desviación
    const confidence = maxDeviation > 0 ? 1 - (deviation / (maxDeviation + 1)) : 0.8;
    return Math.max(0.1, Math.min(0.9, confidence));
}

function calculateNeuralNetConfidence(prediction, recentValues) {
    // Calcular confianza de Red Neuronal basada en estabilidad
    if (recentValues.length < 2) return 0.5;
    
    const variance = calculateVarianceFromValues(recentValues);
    const normalizedVariance = Math.min(variance / 4, 1); // Normalizar varianza
    
    // Mayor confianza con menor varianza
    const confidence = 0.8 - normalizedVariance * 0.6;
    return Math.max(0.1, Math.min(0.9, confidence));
}

function calculateAdvancedTrend(values, timeIndex) {
    if (values.length < 3) return 0;
    
    // Tendencia lineal ponderada
    const linearTrend = calculateLinearTrend(values);
    
    // Tendencia exponencial para capturar aceleración
    const exponentialTrend = calculateExponentialTrend(values);
    
    // Factor de tiempo (tendencia se atenúa con la distancia)
    const timeFactor = Math.exp(-timeIndex * 0.05);
    
    return (linearTrend * 0.7 + exponentialTrend * 0.3) * timeFactor;
}

function calculateLinearTrend(values) {
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return isNaN(slope) ? 0 : slope * 0.3; // Atenuar la tendencia
}

function calculateExponentialTrend(values) {
    if (values.length < 2) return 0;
    
    // Calcular factor de crecimiento exponencial
    let growthSum = 0;
    let validGrowths = 0;
    
    for (let i = 1; i < values.length; i++) {
        if (values[i-1] !== 0) {
            const growth = (values[i] - values[i-1]) / Math.abs(values[i-1]);
            growthSum += growth;
            validGrowths++;
        }
    }
    
    const avgGrowth = validGrowths > 0 ? growthSum / validGrowths : 0;
    return Math.max(-0.5, Math.min(0.5, avgGrowth)) * 0.2; // Limitar y atenuar
}

function calculateAdvancedSeasonality(date) {
    // Componentes estacionales múltiples para astrología
    const month = date.getMonth();
    const day = date.getDate();
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Ciclo zodiacal (12 signos)
    const zodiacalCycle = Math.sin((month + 1) * Math.PI / 6) * 0.3;
    
    // Ciclo lunar aproximado (29.5 días)
    const lunarCycle = Math.cos((dayOfYear % 29.5) / 29.5 * 2 * Math.PI) * 0.2;
    
    // Ciclo semanal
    const weeklyPattern = Math.sin((dayOfYear % 7) / 7 * 2 * Math.PI) * 0.1;
    
    return zodiacalCycle + lunarCycle + weeklyPattern;
}

function calculateVarianceComponent(recentValues, lstmValue, nnValue) {
    // Componente de varianza que considera la dispersión de predicciones
    const variance = calculateVarianceFromValues(recentValues);
    const predictionDiff = Math.abs(lstmValue - nnValue);
    
    // Factor de incertidumbre basado en discrepancia entre modelos
    const uncertaintyFactor = predictionDiff / (Math.abs(lstmValue) + Math.abs(nnValue) + 1);
    
    // Ajuste basado en varianza histórica
    const varianceAdjustment = Math.sqrt(variance) * uncertaintyFactor * 0.1;
    
    return Math.max(-0.5, Math.min(0.5, varianceAdjustment));
}

function generateLSTMFallback(recentValues, timeIndex) {
    // Generar predicción de fallback para LSTM basada en patrones temporales
    const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const trend = calculateLinearTrend(recentValues);
    const seasonality = Math.sin((timeIndex + 1) * Math.PI / 7) * 0.2; // Ciclo semanal
    
    return mean + trend * (timeIndex + 1) + seasonality;
}

function generateNeuralNetFallback(recentValues, timeIndex) {
    // Generar predicción de fallback para NN basada en patrones no lineales
    const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const variance = calculateVarianceFromValues(recentValues);
    
    // Simulación de comportamiento no lineal
    const nonLinearFactor = Math.tanh((timeIndex + 1) * 0.1) * Math.sqrt(variance) * 0.3;
    const randomNoise = (Math.random() - 0.5) * 0.4;
    
    return mean + nonLinearFactor + randomNoise;
}
