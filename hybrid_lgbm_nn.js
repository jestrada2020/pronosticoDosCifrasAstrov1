// ASTROLUNA Premium - Modelo Híbrido LightGBM + Redes Neuronales
async function runHybridLGBMNNModel(data, lightgbmResults, neuralNetResults, iterations) {
    console.log('Iniciando modelo híbrido LightGBM + Redes Neuronales...');
    console.log('Parámetros:', { iterations });
    
    // Simular tiempo de entrenamiento
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const { trainData, testData, targetVariable, numericFeatures } = data;
    
    // Extraer valores objetivo para el análisis
    const trainTargets = trainData.map(row => row[targetVariable]);
    const testTargets = testData.map(row => row[targetVariable]);
    
    console.log('Modelo Híbrido LGBM+NN - Variable objetivo:', targetVariable);
    console.log('Modelo Híbrido LGBM+NN - Datos de entrenamiento:', trainTargets.length);
    console.log('Modelo Híbrido LGBM+NN - Datos de prueba:', testTargets.length);
    
    const predictions = testData.map((item, index) => {
        // Buscar predicciones correspondientes de LightGBM y Redes Neuronales
        const lgbmPred = lightgbmResults.find(p => 
            p.date.getTime() === item.date.getTime()
        )?.predicted;
        
        const nnPred = neuralNetResults.find(p => 
            p.date.getTime() === item.date.getTime()
        )?.predicted;
        
        // Valores de referencia para casos donde falten predicciones
        const recentValues = trainTargets.slice(-Math.min(8, trainTargets.length));
        const recentMean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
        
        // Usar predicciones disponibles o fallback
        const lgbmValue = (lgbmPred !== undefined && !isNaN(lgbmPred)) ? lgbmPred : recentMean;
        const nnValue = (nnPred !== undefined && !isNaN(nnPred)) ? nnPred : recentMean;
        
        // Calcular factores de confianza específicos para LGBM y NN
        const lgbmConfidence = calculateLGBMConfidence(lgbmValue, recentValues, index);
        const nnConfidence = calculateNNConfidence(nnValue, recentValues, index);
        
        // Ponderación adaptativa: LGBM mejor para datos estructurados, NN para patrones complejos
        const dataComplexity = calculateDataComplexity(recentValues);
        const lgbmWeight = 0.65 - dataComplexity * 0.25; // 40-65% según complejidad
        const nnWeight = 1 - lgbmWeight; // 35-60% Neural Network
        
        // Componente de mejora basado en interacción de modelos
        const interactionFactor = calculateLGBMNNInteraction(lgbmValue, nnValue, recentValues);
        
        // Combinar predicciones con análisis de interacción
        const basePrediction = lgbmValue * lgbmWeight + nnValue * nnWeight;
        const enhancedPrediction = basePrediction + interactionFactor;
        
        // Validar que no sea NaN
        const finalPrediction = isNaN(enhancedPrediction) ? recentMean : enhancedPrediction;
        
        return {
            date: item.date,
            actual: item[targetVariable],
            predicted: applyVariableLimits(finalPrediction, targetVariable)
        };
    });
    
    // Generar predicciones futuras
    const futurePredictions = data.futureDates.map((date, index) => {
        // Buscar predicciones futuras correspondientes
        const lgbmFuturePred = lightgbmResults.find(p => 
            p.date.getTime() === date.getTime()
        )?.predicted;
        
        const nnFuturePred = neuralNetResults.find(p => 
            p.date.getTime() === date.getTime()
        )?.predicted;
        
        // Valores de referencia para predicciones futuras
        const allHistoricalValues = [...trainTargets, ...testTargets];
        const recentValues = allHistoricalValues.slice(-12);
        const avgRecent = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
        
        // Usar valores válidos o generar predicciones inteligentes
        const lgbmValue = (lgbmFuturePred !== undefined && !isNaN(lgbmFuturePred)) ? 
                         lgbmFuturePred : generateLGBMFutureFallback(recentValues, index);
        
        const nnValue = (nnFuturePred !== undefined && !isNaN(nnFuturePred)) ? 
                       nnFuturePred : generateNNFutureFallback(recentValues, index);
        
        // Ponderación dinámica para predicciones futuras
        // LGBM pierde precisión a largo plazo, NN mantiene mejor generalización
        const timeHorizon = index + 1;
        const timeFactor = Math.min(timeHorizon / 14, 1); // Normalizar a 2 semanas
        
        const lgbmWeight = 0.7 - timeFactor * 0.4; // Decrece de 70% a 30%
        const nnWeight = 1 - lgbmWeight; // Aumenta de 30% a 70%
        
        // Componentes avanzados para predicciones futuras
        const futureInteraction = calculateLGBMNNInteraction(lgbmValue, nnValue, recentValues);
        const seasonalAdjustment = calculateLGBMNNSeasonal(date);
        
        // Combinar predicciones
        const basePrediction = lgbmValue * lgbmWeight + nnValue * nnWeight;
        const enhancedPrediction = basePrediction + futureInteraction + seasonalAdjustment;
        
        // Validar que no sea NaN
        const finalPrediction = isNaN(enhancedPrediction) ? avgRecent : enhancedPrediction;
        
        return {
            date: date,
            actual: null,
            predicted: Math.max(10, Math.min(99, Math.round(finalPrediction)))
        };
    });
    
    const allPredictions = [...predictions, ...futurePredictions];
    console.log('Modelo Híbrido LGBM+NN completado. Predicciones generadas:', allPredictions.length);
    
    return allPredictions;
}

function calculateLGBMConfidence(prediction, recentValues, timeIndex) {
    // Confianza de LightGBM basada en estabilidad de gradient boosting
    if (recentValues.length < 2) return 0.6;
    
    const variance = calculateVarianceFromValues(recentValues);
    const stability = 1 / (1 + variance); // Mayor estabilidad = mayor confianza
    
    // LightGBM es más confiable en datos estables
    const confidence = 0.4 + stability * 0.4;
    return Math.max(0.2, Math.min(0.8, confidence));
}

function calculateNNConfidence(prediction, recentValues, timeIndex) {
    // Confianza de NN basada en capacidad de generalización
    if (recentValues.length < 2) return 0.5;
    
    const trend = calculateSimpleTrend(recentValues);
    const trendStrength = Math.abs(trend);
    
    // NN es mejor con patrones complejos/no lineales
    const confidence = 0.3 + trendStrength * 0.5;
    return Math.max(0.2, Math.min(0.8, confidence));
}

function calculateDataComplexity(values) {
    // Medir complejidad de los datos para ajustar ponderación
    if (values.length < 3) return 0.5;
    
    // Calcular variabilidad normalizada
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const coefficientVariation = Math.sqrt(variance) / (Math.abs(mean) + 0.1);
    
    // Calcular cambios direccionales (complejidad de patrones)
    let directionalChanges = 0;
    for (let i = 2; i < values.length; i++) {
        const prev = values[i-1] - values[i-2];
        const curr = values[i] - values[i-1];
        if (prev * curr < 0) directionalChanges++; // Cambio de dirección
    }
    const changeRate = directionalChanges / (values.length - 2);
    
    // Combinar métricas de complejidad
    const complexity = (coefficientVariation * 0.6 + changeRate * 0.4);
    return Math.max(0, Math.min(1, complexity));
}

function calculateLGBMNNInteraction(lgbmValue, nnValue, recentValues) {
    // Calcular factor de interacción entre predicciones LGBM y NN
    const predictionDiff = Math.abs(lgbmValue - nnValue);
    const historicalMean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    
    // Si las predicciones difieren mucho, aplicar corrección conservadora
    const divergenceThreshold = 2.0;
    if (predictionDiff > divergenceThreshold) {
        const correctionFactor = (historicalMean - (lgbmValue + nnValue) / 2) * 0.1;
        return correctionFactor;
    }
    
    // Si convergen, reforzar la predicción
    const convergenceFactor = (1 - predictionDiff / divergenceThreshold) * 0.05;
    return convergenceFactor;
}

function calculateLGBMNNSeasonal(date) {
    // Factor estacional específico para LGBM+NN
    const month = date.getMonth();
    const day = date.getDate();
    
    // Ciclo astrológico mensual
    const astrologicalCycle = Math.sin((month + 1) * Math.PI / 6) * 0.25;
    
    // Ciclo quincenal (aproximación lunar)
    const lunarCycle = Math.cos((day / 15) * Math.PI) * 0.15;
    
    return astrologicalCycle + lunarCycle;
}

function generateLGBMFutureFallback(recentValues, timeIndex) {
    // Generar predicción de fallback para LGBM basada en gradient boosting simplificado
    const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const trend = calculateSimpleTrend(recentValues);
    
    // Simulación de gradient boosting: corrección gradual
    const boostingFactor = trend * Math.log(timeIndex + 2) * 0.1;
    
    return mean + boostingFactor;
}

function generateNNFutureFallback(recentValues, timeIndex) {
    // Generar predicción de fallback para NN basada en patrones no lineales
    const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const variance = calculateVarianceFromValues(recentValues);
    
    // Simulación de red neuronal: transformación no lineal
    const nonLinearFactor = Math.tanh((timeIndex + 1) * 0.15) * Math.sqrt(variance) * 0.2;
    const activationNoise = (Math.random() - 0.5) * 0.3;
    
    return mean + nonLinearFactor + activationNoise;
}

function calculateSimpleTrend(values) {
    if (values.length < 2) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return (secondMean - firstMean) / firstHalf.length;
}

function updateHybridLGBMNNResults(results, modelData) {
    // Update table
    const tableBody = document.querySelector('#hybridLGBMNNResults tbody');
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
    
    document.getElementById('hybrid-lgbm-nn-mse').textContent = mse.toFixed(4);
    document.getElementById('hybrid-lgbm-nn-mae').textContent = mae.toFixed(4);
    document.getElementById('hybrid-lgbm-nn-rmse').textContent = rmse.toFixed(4);
    
    // Update chart
    const recentResults = results.slice(-30); // Last 30 days
    
    if (hybridLGBMNNChart) {
        hybridLGBMNNChart.destroy();
    }
    
    const ctx = document.getElementById('hybridLGBMNNChart').getContext('2d');
    hybridLGBMNNChart = new Chart(ctx, {
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
                    label: 'Predicciones Híbrido LGBM+NN',
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
                    text: 'Pronóstico Híbrido LGBM+NN vs Valores Actuales'
                }
            }
        }
    });
    
    // Update forecast cards
    const forecastContainer = document.getElementById('hybrid-lgbm-nn-forecast');
    forecastContainer.innerHTML = '';
    
    const futurePredictions = results.filter(r => r.date > today).slice(0, 7);
    futurePredictions.forEach(prediction => {
        const forecastCard = document.createElement('div');
        forecastCard.className = 'prediction-card bg-green-100 shadow';
        
        // Round predicted value for better display
        const roundedValue = Math.round(prediction.predicted);
        
        forecastCard.innerHTML = `
            <p class="text-sm font-semibold">${prediction.date.toLocaleDateString('es-ES')}</p>
            <p class="text-2xl font-bold text-center text-green-700">${roundedValue}</p>
            <p class="text-xs text-center text-gray-500">(${prediction.predicted.toFixed(2)})</p>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}
