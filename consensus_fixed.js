// ASTROLUNA Premium - Modelo de Consenso
function calculateConsensus(xgboostResults, lightgbmResults, neuralNetResults, hybridResults, lstmResults, lstmNnResults = null, lstmLightgbmResults = null, lstmXgboostResults = null) {
    console.log('=== CALCULANDO CONSENSO ===');
    console.log('XGBoost results structure:', xgboostResults);
    console.log('LightGBM results length:', lightgbmResults?.length);
    console.log('Neural Net results length:', neuralNetResults?.length);
    console.log('Hybrid results length:', hybridResults?.length);
    console.log('LSTM results length:', lstmResults?.length);
    
    // Handle XGBoost results structure (validation + future)
    let xgbArray = [];
    if (xgboostResults && typeof xgboostResults === 'object') {
        if (xgboostResults.validation && Array.isArray(xgboostResults.validation)) {
            xgbArray = [...xgboostResults.validation];
            if (xgboostResults.future && Array.isArray(xgboostResults.future)) {
                xgbArray = [...xgbArray, ...xgboostResults.future];
            }
        } else if (Array.isArray(xgboostResults)) {
            xgbArray = xgboostResults;
        }
    } else {
        console.error('XGBoost results format not recognized:', xgboostResults);
        return [];
    }
    
    console.log('XGBoost array procesado:', xgbArray.length, 'elementos');
    
    if (!lightgbmResults || !neuralNetResults || !hybridResults || !lstmResults) {
        console.error('Faltan resultados de algunos modelos para calcular el consenso');
        return [];
    }
    
    const consensusResults = [];
    const minLength = Math.min(
        xgbArray.length, 
        lightgbmResults.length, 
        neuralNetResults.length, 
        hybridResults.length, 
        lstmResults.length
    );
    
    console.log('Calculando consenso para', minLength, 'elementos');
    
    for (let i = 0; i < minLength; i++) {
        try {
            const xgbPred = xgbArray[i]?.predicted || 50;
            const lgbmPred = lightgbmResults[i]?.predicted || 50;
            const nnPred = neuralNetResults[i]?.predicted || 50;
            const hybridPred = hybridResults[i]?.predicted || 50;
            const lstmPred = lstmResults[i]?.predicted || 50;
            
            // Calculate consensus with weights (simple average for now)
            const validPredictions = [xgbPred, lgbmPred, nnPred, hybridPred, lstmPred].filter(p => !isNaN(p) && p !== null);
            const consensusPred = validPredictions.length > 0 
                ? Math.round(validPredictions.reduce((sum, p) => sum + p, 0) / validPredictions.length)
                : 50;
            
            // Get actual value - prioritize XGBoost, then LightGBM, etc.
            let actualValue = null;
            if (xgbArray[i]?.actual !== null && xgbArray[i]?.actual !== undefined && !isNaN(xgbArray[i]?.actual)) {
                actualValue = xgbArray[i].actual;
            } else if (lightgbmResults[i]?.actual !== null && lightgbmResults[i]?.actual !== undefined && !isNaN(lightgbmResults[i]?.actual)) {
                actualValue = lightgbmResults[i].actual;
            } else if (neuralNetResults[i]?.actual !== null && neuralNetResults[i]?.actual !== undefined && !isNaN(neuralNetResults[i]?.actual)) {
                actualValue = neuralNetResults[i].actual;
            }
            
            // Get date - prioritize XGBoost, then others
            let resultDate = xgbArray[i]?.date || lightgbmResults[i]?.date || neuralNetResults[i]?.date || new Date();
            if (!(resultDate instanceof Date)) {
                resultDate = new Date(resultDate);
            }
            
            consensusResults.push({
                date: resultDate,
                actual: actualValue,
                predicted: consensusPred
            });
            
            console.log(`Consenso ${i}:`, {
                date: resultDate.toLocaleDateString('es-ES'),
                actual: actualValue,
                predicted: consensusPred,
                components: { xgbPred, lgbmPred, nnPred, hybridPred, lstmPred }
            });
            
        } catch (error) {
            console.error(`Error calculando consenso para elemento ${i}:`, error);
        }
    }
    
    console.log('Consenso calculado:', consensusResults.length, 'resultados');
    console.log('Sample consensus final:', consensusResults.slice(0, 3));
    
    return consensusResults;
}

function recalculateConsensus(xgboostWeight, lightgbmWeight, neuralnetWeight, hybridWeight, lstmWeight) {
    if (!xgboostPredictions || !lightgbmPredictions || !neuralnetPredictions || !hybridPredictions || !lstmPredictions) {
        console.error('No todas las predicciones están disponibles para recalcular el consenso');
        return;
    }
    
    const consensusResults = [];
    
    for (let i = 0; i < xgboostPredictions.length; i++) {
        const xgbPred = xgboostPredictions[i].predicted;
        const lgbmPred = lightgbmPredictions[i].predicted;
        const nnPred = neuralnetPredictions[i].predicted;
        const hybridPred = hybridPredictions[i].predicted;
        const lstmPred = lstmPredictions[i].predicted;
        
        const weightedPred = (xgbPred * xgboostWeight) +
                             (lgbmPred * lightgbmWeight) +
                             (nnPred * neuralnetWeight) +
                             (hybridPred * hybridWeight) +
                             (lstmPred * lstmWeight);
                             
        consensusResults.push({
            date: xgboostPredictions[i].date,
            actual: xgboostPredictions[i].actual,
            predicted: Math.round(weightedPred)
        });
    }
    
    consensusPredictions = consensusResults;
    updateConsensusResults(consensusResults, xgboostPredictions, lightgbmPredictions, neuralnetPredictions, hybridPredictions, lstmPredictions, null);
}

window.updateConsensusResults = function(results, xgboostResults, lightgbmResults, neuralNetResults, hybridResults, lstmResults, modelData) {
    console.log('=== ACTUALIZANDO RESULTADOS CONSENSO ===');
    console.log('Results:', results ? results.length : 0);
    console.log('XGBoost:', xgboostResults ? (Array.isArray(xgboostResults) ? xgboostResults.length : 'object') : 0);
    console.log('LightGBM:', lightgbmResults ? lightgbmResults.length : 0);
    console.log('Neural Net:', neuralNetResults ? neuralNetResults.length : 0);
    console.log('Hybrid:', hybridResults ? hybridResults.length : 0);
    console.log('LSTM:', lstmResults ? lstmResults.length : 0);
    
    // Update table
    const tableBody = document.querySelector('#consensusResults tbody');
    console.log('Consensus table body element:', tableBody);
    
    if (!tableBody) {
        console.error('No se encontró el elemento tbody de la tabla Consensus');
        return;
    }
    
    if (!results || results.length === 0) {
        console.warn('No hay resultados de consenso para mostrar');
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-red-500">No hay resultados disponibles</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('Procesando', results.length, 'resultados de consenso');
    
    for (let i = 0; i < results.length; i++) {
        try {
            const result = results[i];
            const row = document.createElement('tr');
            
            const dateCell = document.createElement('td');
            const displayDate = result.date instanceof Date ? 
                result.date.toLocaleDateString('es-ES') : 
                new Date(result.date).toLocaleDateString('es-ES');
            dateCell.textContent = displayDate;
            dateCell.style.textAlign = 'center';
            
            // Extract XGBoost data properly
            let xgbData = null;
            if (xgboostResults && typeof xgboostResults === 'object') {
                if (xgboostResults.validation && xgboostResults.validation[i]) {
                    xgbData = xgboostResults.validation[i];
                } else if (xgboostResults.future && i >= (xgboostResults.validation?.length || 0)) {
                    const futureIndex = i - (xgboostResults.validation?.length || 0);
                    xgbData = xgboostResults.future[futureIndex];
                } else if (Array.isArray(xgboostResults) && xgboostResults[i]) {
                    xgbData = xgboostResults[i];
                }
            }
            
            const xgbCell = document.createElement('td');
            xgbCell.textContent = xgbData && xgbData.predicted !== undefined ? Math.round(xgbData.predicted) : 'N/A';
            xgbCell.style.textAlign = 'center';
            
            const lgbmCell = document.createElement('td');
            lgbmCell.textContent = (lightgbmResults && lightgbmResults[i] && lightgbmResults[i].predicted !== undefined) ? Math.round(lightgbmResults[i].predicted) : 'N/A';
            lgbmCell.style.textAlign = 'center';
            
            const nnCell = document.createElement('td');
            nnCell.textContent = (neuralNetResults && neuralNetResults[i] && neuralNetResults[i].predicted !== undefined) ? Math.round(neuralNetResults[i].predicted) : 'N/A';
            nnCell.style.textAlign = 'center';
            
            const hybridCell = document.createElement('td');
            hybridCell.textContent = (hybridResults && hybridResults[i] && hybridResults[i].predicted !== undefined) ? Math.round(hybridResults[i].predicted) : 'N/A';
            hybridCell.style.textAlign = 'center';

            const lstmCell = document.createElement('td');
            lstmCell.textContent = (lstmResults && lstmResults[i] && lstmResults[i].predicted !== undefined) ? Math.round(lstmResults[i].predicted) : 'N/A';
            lstmCell.style.textAlign = 'center';
            
            const consensusCell = document.createElement('td');
            consensusCell.textContent = result.predicted !== undefined ? Math.round(result.predicted) : 'N/A';
            consensusCell.style.fontWeight = 'bold';
            consensusCell.style.backgroundColor = '#dcfce7';
            consensusCell.style.color = '#166534';
            consensusCell.style.textAlign = 'center';
            
            const actualCell = document.createElement('td');
            actualCell.style.textAlign = 'center';
            
            if (result.actual !== null && result.actual !== undefined && !isNaN(result.actual)) {
                const actualValue = Math.round(Number(result.actual));
                actualCell.textContent = actualValue;
                actualCell.style.backgroundColor = '#dcfce7';
                actualCell.style.fontWeight = 'bold';
                actualCell.style.color = '#166534';
                
                console.log(`✅ Consenso fila ${i} - Valor actual: ${actualValue}`);
            } else {
                actualCell.textContent = 'Futuro';
                actualCell.style.fontStyle = 'italic';
                actualCell.style.backgroundColor = '#fef3c7';
                actualCell.style.color = '#92400e';
                
                console.log(`❌ Consenso fila ${i} - Sin valor actual`);
            }
            
            row.appendChild(dateCell);
            row.appendChild(xgbCell);
            row.appendChild(lgbmCell);
            row.appendChild(nnCell);
            row.appendChild(hybridCell);
            row.appendChild(lstmCell);
            row.appendChild(consensusCell);
            row.appendChild(actualCell);
            
            // Highlight future predictions
            const itemDate = result.date instanceof Date ? result.date : new Date(result.date);
            if (itemDate > today) {
                row.classList.add('highlighted');
                row.style.backgroundColor = '#f0f8ff';
            }
            
            tableBody.appendChild(row);
        } catch (rowError) {
            console.error(`Error procesando fila ${i} de consenso:`, rowError);
        }
    }
    
    console.log('✅ Tabla de consenso actualizada con', results.length, 'filas');
    
    // Create or update consensus chart
    const chartContainer = document.getElementById('consensusChart');
    if (chartContainer) {
        console.log('Creando/actualizando gráfico de consenso...');
        
        // Destroy existing chart
        if (window.consensusChart) {
            window.consensusChart.destroy();
        }
        
        // Prepare data for chart (last 30 points for better visualization)
        const recentResults = results.slice(-30);
        
        const labels = recentResults.map(r => {
            const date = r.date instanceof Date ? r.date : new Date(r.date);
            return date.toLocaleDateString('es-ES');
        });
        
        const actualValues = recentResults.map(r => r.actual !== null && r.actual !== undefined && !isNaN(r.actual) ? r.actual : null);
        const consensusValues = recentResults.map(r => r.predicted);
        
        // Prepare individual model data with proper handling
        const xgbValues = [];
        const lgbmValues = [];
        const nnValues = [];
        const hybridValues = [];
        const lstmValues = [];
        
        for (let i = Math.max(0, results.length - 30); i < results.length; i++) {
            // XGBoost values - handle both array and object structure
            let xgbVal = null;
            if (xgboostResults && typeof xgboostResults === 'object') {
                if (xgboostResults.validation && xgboostResults.validation[i]) {
                    xgbVal = xgboostResults.validation[i].predicted;
                } else if (xgboostResults.future && i >= (xgboostResults.validation?.length || 0)) {
                    const futureIndex = i - (xgboostResults.validation?.length || 0);
                    xgbVal = xgboostResults.future[futureIndex]?.predicted;
                } else if (Array.isArray(xgboostResults) && xgboostResults[i]) {
                    xgbVal = xgboostResults[i].predicted;
                }
            }
            xgbValues.push(xgbVal);
            
            // Other models
            lgbmValues.push(lightgbmResults && lightgbmResults[i] ? lightgbmResults[i].predicted : null);
            nnValues.push(neuralNetResults && neuralNetResults[i] ? neuralNetResults[i].predicted : null);
            hybridValues.push(hybridResults && hybridResults[i] ? hybridResults[i].predicted : null);
            lstmValues.push(lstmResults && lstmResults[i] ? lstmResults[i].predicted : null);
        }
        
        const ctx = chartContainer.getContext('2d');
        window.consensusChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Valores Actuales',
                        data: actualValues,
                        borderColor: '#059669',
                        backgroundColor: 'rgba(5, 150, 105, 0.1)',
                        fill: false,
                        tension: 0.1,
                        pointRadius: 6,
                        pointBackgroundColor: '#059669',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        spanGaps: false
                    },
                    {
                        label: 'Consenso',
                        data: consensusValues,
                        borderColor: '#7c3aed',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        fill: false,
                        tension: 0.1,
                        pointRadius: 5,
                        pointBackgroundColor: '#7c3aed',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        borderWidth: 3
                    },
                    {
                        label: 'XGBoost',
                        data: xgbValues,
                        borderColor: '#dc2626',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        fill: false,
                        tension: 0.1,
                        pointRadius: 2,
                        hidden: true,
                        borderDash: [3, 3]
                    },
                    {
                        label: 'LightGBM',
                        data: lgbmValues,
                        borderColor: '#ca8a04',
                        backgroundColor: 'rgba(202, 138, 4, 0.1)',
                        fill: false,
                        tension: 0.1,
                        pointRadius: 2,
                        hidden: true,
                        borderDash: [3, 3]
                    },
                    {
                        label: 'Neural Network',
                        data: nnValues,
                        borderColor: '#9333ea',
                        backgroundColor: 'rgba(147, 51, 234, 0.1)',
                        fill: false,
                        tension: 0.1,
                        pointRadius: 2,
                        hidden: true,
                        borderDash: [3, 3]
                    },
                    {
                        label: 'Híbrido',
                        data: hybridValues,
                        borderColor: '#ea580c',
                        backgroundColor: 'rgba(234, 88, 12, 0.1)',
                        fill: false,
                        tension: 0.1,
                        pointRadius: 2,
                        hidden: true,
                        borderDash: [3, 3]
                    },
                    {
                        label: 'LSTM',
                        data: lstmValues,
                        borderColor: '#0891b2',
                        backgroundColor: 'rgba(8, 145, 178, 0.1)',
                        fill: false,
                        tension: 0.1,
                        pointRadius: 2,
                        hidden: true,
                        borderDash: [3, 3]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Valores',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Fecha',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Consenso - Comparación de Todos los Modelos',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label === 'Valores Actuales' && context.parsed.y === null) {
                                    return null; // No mostrar tooltip para valores nulos
                                }
                                return context.dataset.label + ': ' + Math.round(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
        
        console.log('✅ Gráfico de consenso creado exitosamente');
    }
    
    // Update forecast cards
    const forecastContainer = document.getElementById('consensus-forecast');
    if (forecastContainer) {
        forecastContainer.innerHTML = '';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futurePredictions = results.filter(r => {
            const itemDate = r.date instanceof Date ? r.date : new Date(r.date);
            return itemDate > today;
        }).slice(0, 7);
        
        futurePredictions.forEach(prediction => {
            const forecastCard = document.createElement('div');
            forecastCard.className = 'prediction-card bg-green-100 shadow';
            
            const roundedValue = Math.round(prediction.predicted);
            const displayDate = prediction.date instanceof Date ? 
                prediction.date.toLocaleDateString('es-ES') : 
                new Date(prediction.date).toLocaleDateString('es-ES');
            
            forecastCard.innerHTML = `
                <p class="text-sm font-semibold">${displayDate}</p>
                <p class="text-2xl font-bold text-center text-green-700">${roundedValue}</p>
            `;
            
            forecastContainer.appendChild(forecastCard);
        });
        
        console.log(`✅ ${futurePredictions.length} predicciones de consenso futuras mostradas`);
    }
    
    console.log('✅ Actualización de consenso completada');
};

console.log('✅ consensus.js cargado completamente');
