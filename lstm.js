// ASTROLUNA Premium - Modelo LSTM
async function runLSTMModel(data, iterations, sequenceLength = 10) {
    console.log('Iniciando modelo LSTM con TensorFlow.js...');
    console.log('Parámetros:', { iterations, sequenceLength });
    
    const { trainData, testData, targetVariable, numericFeatures } = data;
    
    // Preparar datos específicamente para LSTM
    const { trainX, trainY, testX, testY, scaler, sequences } = prepareLSTMData(
        trainData, testData, targetVariable, numericFeatures, sequenceLength
    );
    
    console.log('Datos LSTM preparados - Entrenamiento:', trainX.shape, 'Prueba:', testX.shape);
    console.log('Longitud de secuencia:', sequenceLength);
    
    // Crear modelo LSTM adaptado a la variable objetivo
    const targetScale = getVariableScale(targetVariable);
    const variableComplexity = targetScale.max - targetScale.min;
    
    // Adaptar arquitectura LSTM según la variable
    let lstmUnits1, lstmUnits2, denseUnits, dropoutRate, learningRate;
    switch(targetVariable) {
        case 'DC':
            // DC tiene patrones temporales más estables
            lstmUnits1 = 40; lstmUnits2 = 20; denseUnits = 15; dropoutRate = 0.15; learningRate = 0.0008;
            break;
        case 'EXT':
            // EXT tiene secuencias más complejas
            lstmUnits1 = 64; lstmUnits2 = 40; denseUnits = 30; dropoutRate = 0.25; learningRate = 0.0006;
            break;
        case 'ULT2':
            // ULT2 patrones temporales intermedios
            lstmUnits1 = 50; lstmUnits2 = 30; denseUnits = 25; dropoutRate = 0.2; learningRate = 0.0007;
            break;
        case 'PM2':
            // PM2 secuencias muy complejas y no lineales
            lstmUnits1 = 80; lstmUnits2 = 50; denseUnits = 40; dropoutRate = 0.3; learningRate = 0.0005;
            break;
        case 'C1C3':
            // C1C3 dependencias temporales específicas
            lstmUnits1 = 45; lstmUnits2 = 25; denseUnits = 20; dropoutRate = 0.18; learningRate = 0.0009;
            break;
        case 'C2C4':
            // C2C4 patrones temporales balanceados
            lstmUnits1 = 55; lstmUnits2 = 35; denseUnits = 28; dropoutRate = 0.22; learningRate = 0.0007;
            break;
        default:
            lstmUnits1 = 50; lstmUnits2 = 30; denseUnits = 25; dropoutRate = 0.2; learningRate = 0.001;
    }
    
    console.log(`Arquitectura LSTM para ${targetVariable}: ${lstmUnits1}-${lstmUnits2}-${denseUnits}, dropout: ${dropoutRate}, lr: ${learningRate}`);
    
    // Crear modelo LSTM
    const model = tf.sequential({
        layers: [
            // Primera capa LSTM adaptada
            tf.layers.lstm({
                units: lstmUnits1,
                returnSequences: true,
                inputShape: [sequenceLength, numericFeatures.length],
                dropout: dropoutRate,
                recurrentDropout: dropoutRate
            }),
            
            // Segunda capa LSTM
            tf.layers.lstm({
                units: lstmUnits2,
                returnSequences: false,
                dropout: dropoutRate,
                recurrentDropout: dropoutRate
            }),
            
            // Capas densas para refinamiento adaptadas
            tf.layers.dense({
                units: denseUnits,
                activation: 'relu'
            }),
            tf.layers.dropout({ rate: dropoutRate * 0.5 }),
            
            tf.layers.dense({
                units: Math.max(5, Math.floor(denseUnits / 2)),
                activation: 'relu'
            }),
            
            // Capa de salida
            tf.layers.dense({
                units: 1,
                activation: 'linear'
            })
        ]
    });
    
    // Compilar modelo con optimizador específico para LSTM adaptado
    model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: 'meanSquaredError',
        metrics: ['mae']
    });
    
    console.log('Modelo LSTM creado. Iniciando entrenamiento...');
    
    // Entrenar modelo LSTM
    const epochs = Math.min(iterations, 100);
    const history = await model.fit(trainX, trainY, {
        epochs: epochs,
        batchSize: Math.min(16, Math.floor(trainData.length / 4)),
        validationSplit: 0.2,
        verbose: 0,
        shuffle: true,
        callbacks: {
            onEpochEnd: async (epoch, logs) => {
                if (epoch % 20 === 0) {
                    console.log(`LSTM Época ${epoch + 1}/${epochs} - Loss: ${logs.loss.toFixed(4)}, MAE: ${logs.mae.toFixed(4)}`);
                }
                await tf.nextFrame();
            }
        }
    });
    
    console.log('Entrenamiento LSTM completado. Generando predicciones...');
    
    // Hacer predicciones en el conjunto de prueba
    const testPredictions = model.predict(testX);
    const testPredArray = await testPredictions.data();
    
    // Desnormalizar predicciones
    const denormalizedPredictions = denormalizeLSTMData(Array.from(testPredArray), scaler);
    
    const predictions = testData.slice(sequenceLength).map((item, index) => ({
        date: item.date,
        actual: item[targetVariable],
        predicted: applyVariableLimits(denormalizedPredictions[index], targetVariable)
    }));
    
    // Generar predicciones futuras usando LSTM
    const futurePredictions = await generateLSTMFuturePredictions(
        model, data, trainData, testData, targetVariable, numericFeatures, scaler, sequenceLength
    );
    
    // Limpiar memoria
    model.dispose();
    trainX.dispose();
    trainY.dispose();
    testX.dispose();
    testY.dispose();
    testPredictions.dispose();
    
    const allPredictions = [...predictions, ...futurePredictions];
    console.log('LSTM completado. Predicciones generadas:', allPredictions.length);
    
    return allPredictions;
}

function prepareLSTMData(trainData, testData, targetVariable, numericFeatures, sequenceLength) {
    // Combinar todos los datos para crear secuencias continuas
    const allData = [...trainData, ...testData];
    
    // Extraer características y objetivo
    const allFeatures = allData.map(row => 
        numericFeatures.map(feature => row[feature] || 0)
    );
    const allTargets = allData.map(row => row[targetVariable]);
    
    // Calcular estadísticas para normalización
    const scaler = calculateLSTMScaler(allFeatures, allTargets);
    
    // Normalizar datos
    const normalizedFeatures = normalizeLSTMFeatures(allFeatures, scaler.features);
    const normalizedTargets = normalizeLSTMTargets(allTargets, scaler.target);
    
    // Crear secuencias para LSTM
    const sequences = [];
    const targets = [];
    
    for (let i = sequenceLength; i < normalizedFeatures.length; i++) {
        // Secuencia de características (ventana deslizante)
        const sequence = normalizedFeatures.slice(i - sequenceLength, i);
        sequences.push(sequence);
        
        // Objetivo correspondiente
        targets.push(normalizedTargets[i]);
    }
    
    // Dividir en entrenamiento y prueba manteniendo el orden temporal
    const trainSize = Math.floor(sequences.length * 0.8);
    
    const trainSequences = sequences.slice(0, trainSize);
    const trainTargets = targets.slice(0, trainSize);
    
    const testSequences = sequences.slice(trainSize);
    const testTargets = targets.slice(trainSize);
    
    // Convertir a tensores
    const trainX = tf.tensor3d(trainSequences);
    const trainY = tf.tensor1d(trainTargets);
    const testX = tf.tensor3d(testSequences);
    const testY = tf.tensor1d(testTargets);
    
    return { trainX, trainY, testX, testY, scaler, sequences };
}

function calculateLSTMScaler(features, targets) {
    // Calcular estadísticas para normalización específica de LSTM
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

function normalizeLSTMFeatures(features, featureStats) {
    return features.map(row => 
        row.map((value, i) => 
            (value - featureStats[i].mean) / featureStats[i].std
        )
    );
}

function normalizeLSTMTargets(targets, targetStats) {
    return targets.map(value => (value - targetStats.mean) / targetStats.std);
}

function denormalizeLSTMData(normalizedData, scaler) {
    return normalizedData.map(value => value * scaler.target.std + scaler.target.mean);
}

async function generateLSTMFuturePredictions(model, data, trainData, testData, targetVariable, numericFeatures, scaler, sequenceLength) {
    const futurePredictions = [];
    
    // Usar los últimos datos como semilla para predicciones futuras
    const allData = [...trainData, ...testData];
    const lastFeatures = allData.slice(-sequenceLength).map(row => 
        numericFeatures.map(feature => row[feature] || 0)
    );
    
    // Normalizar las características semilla
    const normalizedSeed = normalizeLSTMFeatures(lastFeatures, scaler.features);
    let currentSequence = [...normalizedSeed];
    
    for (let i = 0; i < data.futureDates.length; i++) {
        // Usar la secuencia actual para predecir el siguiente valor
        const inputTensor = tf.tensor3d([currentSequence]);
        const prediction = model.predict(inputTensor);
        const predictionArray = await prediction.data();
        
        // Desnormalizar predicción
        const denormalizedPrediction = denormalizeLSTMData([predictionArray[0]], scaler)[0];
        
        futurePredictions.push({
            date: data.futureDates[i],
            actual: null,
            predicted: applyVariableLimits(denormalizedPrediction, targetVariable)
        });
        
        // Actualizar secuencia para la siguiente predicción
        // Crear características sintéticas para el siguiente paso
        const nextFeatures = generateNextLSTMFeatures(currentSequence, scaler, i);
        
        // Deslizar la ventana: remover el primer elemento y agregar el nuevo
        currentSequence = [...currentSequence.slice(1), nextFeatures];
        
        // Limpiar memoria
        inputTensor.dispose();
        prediction.dispose();
    }
    
    return futurePredictions;
}

function generateNextLSTMFeatures(currentSequence, scaler, stepIndex) {
    // Generar características sintéticas para el siguiente paso temporal
    const lastFeatures = currentSequence[currentSequence.length - 1];
    const secondLastFeatures = currentSequence[currentSequence.length - 2] || lastFeatures;
    
    // Calcular tendencia y generar siguiente punto
    const nextFeatures = lastFeatures.map((value, i) => {
        const trend = lastFeatures[i] - secondLastFeatures[i];
        const seasonality = Math.sin((stepIndex + 1) * Math.PI / 6) * 0.1; // Factor estacional
        const noise = (Math.random() - 0.5) * 0.2; // Ruido controlado
        
        return value + trend * 0.5 + seasonality + noise;
    });
    
    return nextFeatures;
}

function updateLSTMResults(results, modelData) {
    // Update table
    const tableBody = document.querySelector('#lstmResults tbody');
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
    
    document.getElementById('lstm-mse').textContent = mse.toFixed(4);
    document.getElementById('lstm-mae').textContent = mae.toFixed(4);
    document.getElementById('lstm-rmse').textContent = rmse.toFixed(4);
    
    // Update chart
    const recentResults = results.slice(-30); // Last 30 days
    
    if (lstmChart) {
        lstmChart.destroy();
    }
    
    const ctx = document.getElementById('lstmChart').getContext('2d');
    lstmChart = new Chart(ctx, {
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
                    label: 'Predicciones LSTM',
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
                    text: 'Pronóstico LSTM vs Valores Actuales'
                }
            }
        }
    });
    
    // Update forecast cards
    const forecastContainer = document.getElementById('lstm-forecast');
    forecastContainer.innerHTML = '';
    
    const futurePredictions = results.filter(r => r.date > today).slice(0, 7);
    futurePredictions.forEach(prediction => {
        const forecastCard = document.createElement('div');
        forecastCard.className = 'prediction-card bg-teal-100 shadow';
        
        // Round predicted value for better display
        const roundedValue = Math.round(prediction.predicted);
        
        forecastCard.innerHTML = `
            <p class="text-sm font-semibold">${prediction.date.toLocaleDateString('es-ES')}</p>
            <p class="text-2xl font-bold text-center text-teal-700">${roundedValue}</p>
            <p class="text-xs text-center text-gray-500">(${prediction.predicted.toFixed(2)})</p>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}
