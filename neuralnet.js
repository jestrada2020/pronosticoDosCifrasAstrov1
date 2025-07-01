// ASTROLUNA Premium - Modelo de Redes Neuronales
async function runNeuralNetModel(data, iterations) {
    console.log('Iniciando modelo de Redes Neuronales con TensorFlow.js...');
    console.log('Épocas de entrenamiento:', iterations);
    
    const { trainData, testData, targetVariable, numericFeatures } = data;
    
    // Preparar datos para TensorFlow.js
    const { trainX, trainY, testX, testY, scaler } = prepareNeuralNetData(trainData, testData, targetVariable, numericFeatures);
    
    console.log('Datos preparados - Entrenamiento:', trainX.shape, 'Prueba:', testX.shape);
    
    // Crear modelo de red neuronal adaptado a la variable objetivo
    const targetScale = getVariableScale(targetVariable);
    const variableComplexity = targetScale.max - targetScale.min;
    
    // Adaptar arquitectura según la complejidad de la variable
    let hiddenUnits1, hiddenUnits2, dropoutRate, learningRate;
    switch(targetVariable) {
        case 'DC':
            // DC es más estable, red más simple
            hiddenUnits1 = 48; hiddenUnits2 = 24; dropoutRate = 0.15; learningRate = 0.001;
            break;
        case 'EXT':
            // EXT más volátil, red más compleja
            hiddenUnits1 = 80; hiddenUnits2 = 40; dropoutRate = 0.25; learningRate = 0.0008;
            break;
        case 'ULT2':
            // ULT2 patrones intermedios
            hiddenUnits1 = 64; hiddenUnits2 = 32; dropoutRate = 0.2; learningRate = 0.0009;
            break;
        case 'PM2':
            // PM2 muy complejo, red profunda
            hiddenUnits1 = 96; hiddenUnits2 = 48; dropoutRate = 0.3; learningRate = 0.0007;
            break;
        case 'C1C3':
            // C1C3 interacciones específicas
            hiddenUnits1 = 56; hiddenUnits2 = 28; dropoutRate = 0.18; learningRate = 0.0012;
            break;
        case 'C2C4':
            // C2C4 interacciones balanceadas
            hiddenUnits1 = 72; hiddenUnits2 = 36; dropoutRate = 0.22; learningRate = 0.001;
            break;
        default:
            hiddenUnits1 = 64; hiddenUnits2 = 32; dropoutRate = 0.2; learningRate = 0.001;
    }
    
    console.log(`Arquitectura para ${targetVariable}: ${hiddenUnits1}-${hiddenUnits2}, dropout: ${dropoutRate}, lr: ${learningRate}`);
    
    const model = tf.sequential({
        layers: [
            tf.layers.dense({
                inputShape: [numericFeatures.length],
                units: hiddenUnits1,
                activation: 'relu',
                kernelInitializer: 'heUniform'
            }),
            tf.layers.dropout({ rate: dropoutRate }),
            tf.layers.dense({
                units: hiddenUnits2,
                activation: 'relu',
                kernelInitializer: 'heUniform'
            }),
            tf.layers.dropout({ rate: dropoutRate * 0.5 }),
            tf.layers.dense({
                units: Math.max(8, Math.floor(hiddenUnits2 / 4)),
                activation: 'relu'
            }),
            tf.layers.dense({
                units: 1,
                activation: 'linear'
            })
        ]
    });
    
    // Compilar modelo con optimizador adaptado
    model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: 'meanSquaredError',
        metrics: ['mae']
    });
    
    console.log('Modelo creado. Iniciando entrenamiento...');
    
    // Entrenar modelo con menos épocas para no bloquear la UI
    const epochs = Math.min(iterations, 50);
    const history = await model.fit(trainX, trainY, {
        epochs: epochs,
        batchSize: Math.min(32, trainData.length),
        validationSplit: 0.2,
        verbose: 0,
        callbacks: {
            onEpochEnd: async (epoch, logs) => {
                if (epoch % 10 === 0) {
                    console.log(`Época ${epoch + 1}/${epochs} - Loss: ${logs.loss.toFixed(4)}, MAE: ${logs.mae.toFixed(4)}`);
                }
                // Dar tiempo al navegador para actualizar la UI
                await tf.nextFrame();
            }
        }
    });
    
    console.log('Entrenamiento completado. Generando predicciones...');
    
    // Hacer predicciones en el conjunto de prueba
    const testPredictions = model.predict(testX);
    const testPredArray = await testPredictions.data();
    
    // Desnormalizar predicciones
    const denormalizedPredictions = denormalizeData(Array.from(testPredArray), scaler, targetVariable);
    
    const predictions = testData.map((item, index) => ({
        date: item.date,
        actual: item[targetVariable],
        predicted: applyVariableLimits(denormalizedPredictions[index], targetVariable)
    }));
    
    // Generar predicciones futuras
    const futurePredictions = await generateFuturePredictions(model, data, trainData, testData, targetVariable, numericFeatures, scaler);
    
    // Limpiar memoria
    model.dispose();
    trainX.dispose();
    trainY.dispose();
    testX.dispose();
    testY.dispose();
    testPredictions.dispose();
    
    const allPredictions = [...predictions, ...futurePredictions];
    console.log('Red Neuronal completada. Predicciones generadas:', allPredictions.length);
    
    return allPredictions;
}

function prepareNeuralNetData(trainData, testData, targetVariable, numericFeatures) {
    // Extraer características numéricas y objetivo
    const trainFeatures = trainData.map(row => 
        numericFeatures.map(feature => row[feature] || 0)
    );
    const trainTargets = trainData.map(row => row[targetVariable]);
    
    const testFeatures = testData.map(row => 
        numericFeatures.map(feature => row[feature] || 0)
    );
    const testTargets = testData.map(row => row[targetVariable]);
    
    // Normalizar datos
    const scaler = calculateScaler([...trainFeatures, ...testFeatures], [...trainTargets, ...testTargets]);
    
    const normalizedTrainX = normalizeFeatures(trainFeatures, scaler.features);
    const normalizedTrainY = normalizeTargets(trainTargets, scaler.target);
    
    const normalizedTestX = normalizeFeatures(testFeatures, scaler.features);
    const normalizedTestY = normalizeTargets(testTargets, scaler.target);
    
    // Convertir a tensores
    const trainX = tf.tensor2d(normalizedTrainX);
    const trainY = tf.tensor1d(normalizedTrainY);
    const testX = tf.tensor2d(normalizedTestX);
    const testY = tf.tensor1d(normalizedTestY);
    
    return { trainX, trainY, testX, testY, scaler };
}

function calculateScaler(features, targets) {
    // Calcular estadísticas para normalización
    const featureStats = [];
    const numFeatures = features[0].length;
    
    for (let i = 0; i < numFeatures; i++) {
        const values = features.map(row => row[i]);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
        featureStats.push({ mean, std: Math.max(std, 1e-8) });
    }
    
    const targetMean = targets.reduce((a, b) => a + b, 0) / targets.length;
    const targetStd = Math.sqrt(targets.reduce((sum, val) => sum + Math.pow(val - targetMean, 2), 0) / targets.length);
    
    return {
        features: featureStats,
        target: { mean: targetMean, std: Math.max(targetStd, 1e-8) }
    };
}

function normalizeFeatures(features, featureStats) {
    return features.map(row => 
        row.map((value, i) => 
            (value - featureStats[i].mean) / featureStats[i].std
        )
    );
}

function normalizeTargets(targets, targetStats) {
    return targets.map(value => (value - targetStats.mean) / targetStats.std);
}

function denormalizeData(normalizedData, scaler, variable) {
    if (variable === 'target') {
        return normalizedData.map(value => value * scaler.target.std + scaler.target.mean);
    }
    return normalizedData;
}

async function generateFuturePredictions(model, data, trainData, testData, targetVariable, numericFeatures, scaler) {
    const futurePredictions = [];
    
    // Usar los últimos datos como base para predicciones futuras
    const lastKnownData = [...trainData, ...testData].slice(-10);
    
    for (let i = 0; i < data.futureDates.length; i++) {
        // Crear características sintéticas basadas en tendencias
        const futureFeatures = numericFeatures.map(feature => {
            const recentValues = lastKnownData.map(row => row[feature] || 0);
            const trend = calculateSimpleTrend(recentValues);
            const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
            
            return mean + trend * (i + 1) + (Math.random() - 0.5) * 0.5;
        });
        
        // Normalizar y predecir
        const normalizedFeatures = normalizeFeatures([futureFeatures], scaler.features);
        const inputTensor = tf.tensor2d(normalizedFeatures);
        
        const prediction = model.predict(inputTensor);
        const predictionArray = await prediction.data();
        
        const denormalizedPrediction = denormalizeData(Array.from(predictionArray), scaler, 'target')[0];
        
        futurePredictions.push({
            date: data.futureDates[i],
            actual: null,
            predicted: applyVariableLimits(denormalizedPrediction, targetVariable)
        });
        
        // Limpiar memoria
        inputTensor.dispose();
        prediction.dispose();
    }
    
    return futurePredictions;
}

function calculateSimpleTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const firstHalf = values.slice(0, Math.floor(n/2));
    const secondHalf = values.slice(Math.floor(n/2));
    
    const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return (secondMean - firstMean) / (n / 2);
}

function updateNeuralNetResults(results, modelData) {
    // Update table
    const tableBody = document.querySelector('#neuralnetResults tbody');
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
                    text: 'Pronóstico Red Neuronal DC vs Valores Actuales'
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
            <p class="text-xs text-center text-gray-500">(${prediction.predicted.toFixed(2)})</p>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}
