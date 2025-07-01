// ASTROLUNA Premium - Modelo Híbrido LightGBM + LSTM
async function runHybridLGBMLSTMModel(data, lightgbmResults, lstmResults, iterations) {
    console.log('Iniciando modelo híbrido LightGBM + LSTM...');
    console.log('Parámetros:', { iterations });
    
    // Simular tiempo de entrenamiento
    await new Promise(resolve => setTimeout(resolve, 1400));
    
    const { trainData, testData, targetVariable, numericFeatures } = data;
    
    // Extraer valores objetivo para el análisis
    const trainTargets = trainData.map(row => row[targetVariable]);
    const testTargets = testData.map(row => row[targetVariable]);
    
    console.log('Modelo Híbrido LGBM+LSTM - Variable objetivo:', targetVariable);
    console.log('Modelo Híbrido LGBM+LSTM - Datos de entrenamiento:', trainTargets.length);
    console.log('Modelo Híbrido LGBM+LSTM - Datos de prueba:', testTargets.length);
    
    const predictions = testData.map((item, index) => {
        // Buscar predicciones correspondientes de LightGBM y LSTM
        const lgbmPred = lightgbmResults.find(p => 
            p.date.getTime() === item.date.getTime()
        )?.predicted;
        
        const lstmPred = lstmResults.find(p => 
            p.date.getTime() === item.date.getTime()
        )?.predicted;
        
        // Valores de referencia para casos donde falten predicciones
        const recentValues = trainTargets.slice(-Math.min(12, trainTargets.length));
        const recentMean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
        
        // Usar predicciones disponibles o fallback
        const lgbmValue = (lgbmPred !== undefined && !isNaN(lgbmPred)) ? lgbmPred : recentMean;
        const lstmValue = (lstmPred !== undefined && !isNaN(lstmPred)) ? lstmPred : recentMean;
        
        // Calcular factores de confianza específicos para LGBM y LSTM
        const temporalStability = calculateTemporalStability(recentValues);
        const dataStructure = calculateDataStructure(recentValues);
        
        // Ponderación adaptativa: LGBM para estructuras, LSTM para patrones temporales
        // LSTM es superior para secuencias temporales complejas
        const lstmWeight = 0.6 + temporalStability * 0.2; // 60-80% según estabilidad temporal
        const lgbmWeight = 1 - lstmWeight; // 20-40% LightGBM
        
        // Componente de sinergia temporal-estructural
        const synergyFactor = calculateLGBMLSTMSynergy(lgbmValue, lstmValue, recentValues, index);
        
        // Análisis de momentum temporal
        const momentumFactor = calculateTemporalMomentum(recentValues, index);
        
        // Combinar predicciones con análisis sinérgico
        const basePrediction = lgbmValue * lgbmWeight + lstmValue * lstmWeight;
        const enhancedPrediction = basePrediction + synergyFactor + momentumFactor;
        
        // Validar que no sea NaN
        const finalPrediction = isNaN(enhancedPrediction) ? recentMean : enhancedPrediction;
        
        return {
            date: item.date,
            actual: item[targetVariable],
            predicted: Math.max(10, Math.min(99, Math.round(finalPrediction)))
        };
    });
    
    // Generar predicciones futuras
    const futurePredictions = data.futureDates.map((date, index) => {
        // Buscar predicciones futuras correspondientes
        const lgbmFuturePred = lightgbmResults.find(p => 
            p.date.getTime() === date.getTime()
        )?.predicted;
        
        const lstmFuturePred = lstmResults.find(p => 
            p.date.getTime() === date.getTime()
        )?.predicted;
        
        // Valores de referencia para predicciones futuras
        const allHistoricalValues = [...trainTargets, ...testTargets];
        const recentValues = allHistoricalValues.slice(-15);
        const avgRecent = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
        
        // Usar valores válidos o generar predicciones inteligentes
        const lgbmValue = (lgbmFuturePred !== undefined && !isNaN(lgbmFuturePred)) ? 
                         lgbmFuturePred : generateLGBMTemporalFallback(recentValues, index);
        
        const lstmValue = (lstmFuturePred !== undefined && !isNaN(lstmFuturePred)) ? 
                         lstmFuturePred : generateLSTMTemporalFallback(recentValues, index);
        
        // Ponderación dinámica para predicciones futuras
        // LSTM mantiene mejor memoria a largo plazo, LGBM es más conservador
        const timeHorizon = index + 1;
        const memoryDecay = Math.exp(-timeHorizon * 0.1); // Decaimiento de memoria
        
        const lstmWeight = 0.7 + (1 - memoryDecay) * 0.2; // Aumenta de 70% a 90%
        const lgbmWeight = 1 - lstmWeight; // Decrece de 30% a 10%
        
        // Componentes avanzados para predicciones futuras
        const futureSynergy = calculateLGBMLSTMSynergy(lgbmValue, lstmValue, recentValues, index);
        const futureMomentum = calculateTemporalMomentum(recentValues, index + predictions.length);
        const seasonalMemory = calculateSeasonalMemory(date, recentValues);
        
        // Combinar predicciones
        const basePrediction = lgbmValue * lgbmWeight + lstmValue * lstmWeight;
        const enhancedPrediction = basePrediction + futureSynergy + futureMomentum + seasonalMemory;
        
        // Validar que no sea NaN
        const finalPrediction = isNaN(enhancedPrediction) ? avgRecent : enhancedPrediction;
        
        return {
            date: date,
            actual: null,
            predicted: Math.max(10, Math.min(99, Math.round(finalPrediction)))
        };
    });
    
    const allPredictions = [...predictions, ...futurePredictions];
    console.log('Modelo Híbrido LGBM+LSTM completado. Predicciones generadas:', allPredictions.length);
    
    return allPredictions;
}

function calculateTemporalStability(values) {
    // Medir estabilidad temporal para optimizar ponderación LSTM
    if (values.length < 3) return 0.5;
    
    // Calcular variación en las diferencias temporales
    const diffs = [];
    for (let i = 1; i < values.length; i++) {
        diffs.push(values[i] - values[i-1]);
    }
    
    const diffMean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const diffVariance = diffs.reduce((sum, d) => sum + Math.pow(d - diffMean, 2), 0) / diffs.length;
    
    // Mayor estabilidad temporal favorece LSTM
    const stability = 1 / (1 + Math.sqrt(diffVariance));
    return Math.max(0.1, Math.min(0.9, stability));
}

function calculateDataStructure(values) {
    // Analizar estructura de datos para optimizar LGBM
    if (values.length < 4) return 0.5;
    
    // Detectar patrones estructurales (periodicidades simples)
    let periodicityScore = 0;
    const halfLength = Math.floor(values.length / 2);
    
    for (let period = 2; period <= halfLength; period++) {
        let correlation = 0;
        let count = 0;
        
        for (let i = period; i < values.length; i++) {
            const current = values[i];
            const periodic = values[i - period];
            correlation += Math.abs(current - periodic);
            count++;
        }
        
        const avgCorrelation = correlation / count;
        const normalizedCorr = 1 / (1 + avgCorrelation);
        periodicityScore = Math.max(periodicityScore, normalizedCorr);
    }
    
    return Math.max(0.1, Math.min(0.9, periodicityScore));
}

function calculateLGBMLSTMSynergy(lgbmValue, lstmValue, recentValues, timeIndex) {
    // Calcular sinergia entre predicciones LGBM y LSTM
    const predictionAvg = (lgbmValue + lstmValue) / 2;
    const historicalMean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    
    // Sinergia basada en convergencia hacia la media histórica
    const convergenceToMean = Math.abs(predictionAvg - historicalMean);
    const maxExpectedDeviation = 3.0;
    
    if (convergenceToMean < maxExpectedDeviation) {
        // Si convergen razonablemente, reforzar predicción
        const synergyBoost = (1 - convergenceToMean / maxExpectedDeviation) * 0.1;
        return synergyBoost * Math.sign(predictionAvg - historicalMean);
    } else {
        // Si divergen mucho, aplicar corrección conservadora
        const correction = (historicalMean - predictionAvg) * 0.05;
        return correction;
    }
}

function calculateTemporalMomentum(values, timeIndex) {
    // Calcular momentum temporal para predicciones
    if (values.length < 3) return 0;
    
    // Momentum de corto plazo (últimos 3 valores)
    const shortTerm = values.slice(-3);
    const shortMomentum = shortTerm.length >= 2 ? 
        (shortTerm[shortTerm.length-1] - shortTerm[0]) / (shortTerm.length-1) : 0;
    
    // Momentum de largo plazo (todos los valores)
    const longMomentum = values.length >= 2 ? 
        (values[values.length-1] - values[0]) / (values.length-1) : 0;
    
    // Combinar momentums con decaimiento temporal
    const timeFactor = Math.exp(-timeIndex * 0.05);
    const combinedMomentum = (shortMomentum * 0.7 + longMomentum * 0.3) * timeFactor * 0.1;
    
    return Math.max(-0.5, Math.min(0.5, combinedMomentum));
}

function calculateSeasonalMemory(date, recentValues) {
    // Memoria estacional específica para LGBM+LSTM
    const month = date.getMonth();
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Memoria de patrones estacionales basada en datos recientes
    const recentVariability = calculateVarianceFromValues(recentValues);
    const seasonalStrength = Math.min(recentVariability / 2, 1);
    
    // Ciclo anual astrológico con memoria adaptativa
    const annualCycle = Math.sin((dayOfYear / 365.25) * 2 * Math.PI) * seasonalStrength * 0.2;
    
    // Ciclo mensual con memoria de patrones
    const monthlyCycle = Math.cos((month + 1) * Math.PI / 6) * seasonalStrength * 0.15;
    
    return annualCycle + monthlyCycle;
}

function generateLGBMTemporalFallback(recentValues, timeIndex) {
    // Generar predicción de fallback para LGBM con enfoque temporal
    const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const trend = calculateSimpleTrend(recentValues);
    
    // Gradient boosting temporal: corrección basada en secuencia
    const temporalBoost = trend * Math.log(timeIndex + 2) * 0.08;
    const structuralNoise = (Math.random() - 0.5) * 0.2;
    
    return mean + temporalBoost + structuralNoise;
}

function generateLSTMTemporalFallback(recentValues, timeIndex) {
    // Generar predicción de fallback para LSTM con memoria temporal
    const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    
    // Simulación de memoria LSTM: patrón exponencial con ruido
    const memoryDecay = Math.exp(-timeIndex * 0.1);
    const memoryPattern = calculateTemporalMomentum(recentValues, timeIndex) * memoryDecay;
    
    // Componente de secuencia temporal
    const sequenceComponent = Math.tanh(timeIndex * 0.1) * 0.3;
    
    return mean + memoryPattern + sequenceComponent;
}

function updateHybridLGBMLSTMResults(results, modelData) {
    // Update table
    const tableBody = document.querySelector('#hybridLGBMLSTMResults tbody');
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
    
    document.getElementById('hybrid-lgbm-lstm-mse').textContent = mse.toFixed(4);
    document.getElementById('hybrid-lgbm-lstm-mae').textContent = mae.toFixed(4);
    document.getElementById('hybrid-lgbm-lstm-rmse').textContent = rmse.toFixed(4);
    
    // Update chart
    const recentResults = results.slice(-30); // Last 30 days
    
    if (hybridLGBMLSTMChart) {
        hybridLGBMLSTMChart.destroy();
    }
    
    const ctx = document.getElementById('hybridLGBMLSTMChart').getContext('2d');
    hybridLGBMLSTMChart = new Chart(ctx, {
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
                    label: 'Predicciones Híbrido LGBM+LSTM',
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
                    text: 'Pronóstico Híbrido LGBM+LSTM vs Valores Actuales'
                }
            }
        }
    });
    
    // Update forecast cards
    const forecastContainer = document.getElementById('hybrid-lgbm-lstm-forecast');
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
            <p class="text-xs text-center text-gray-500">(${prediction.predicted.toFixed(2)})</p>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}
