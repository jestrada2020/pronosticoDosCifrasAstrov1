// ASTROLUNA Premium - Manejadores de eventos
document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('border-indigo-600');
                btn.classList.remove('text-indigo-600');
                btn.classList.add('text-gray-500');
            });
            
            // Add active class to clicked tab
            button.classList.add('border-indigo-600');
            button.classList.add('text-indigo-600');
            button.classList.remove('text-gray-500');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show corresponding content
            const tabId = button.id.replace('tab-', 'content-');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Accordion functionality
    document.querySelectorAll('.accordion-btn').forEach(button => {
        button.addEventListener('click', function() {
            const content = this.nextElementSibling;
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                this.querySelector('i').classList.remove('fa-chevron-down');
                this.querySelector('i').classList.add('fa-chevron-up');
            } else {
                content.classList.add('hidden');
                this.querySelector('i').classList.remove('fa-chevron-up');
                this.querySelector('i').classList.add('fa-chevron-down');
            }
        });
    });

    // File handling
    document.getElementById('file1').addEventListener('change', function(e) {
        const fileName = e.target.files[0]?.name || "No se ha seleccionado ningún archivo";
        document.getElementById('file1Name').textContent = fileName;
    });

    document.getElementById('file2').addEventListener('change', function(e) {
        const fileName = e.target.files[0]?.name || "No se ha seleccionado ningún archivo";
        document.getElementById('file2Name').textContent = fileName;
    });

    // Forecast days slider
    document.getElementById('forecastDays').addEventListener('input', function() {
        document.getElementById('forecastDaysValue').textContent = this.value + " días";
    });

    // Model weights sliders
    document.getElementById('xgboost-weight').addEventListener('input', function() {
        document.getElementById('xgboost-weight-value').textContent = this.value + "%";
    });
    
    document.getElementById('lightgbm-weight').addEventListener('input', function() {
        document.getElementById('lightgbm-weight-value').textContent = this.value + "%";
    });
    
    document.getElementById('neuralnet-weight').addEventListener('input', function() {
        document.getElementById('neuralnet-weight-value').textContent = this.value + "%";
    });
    
    document.getElementById('lstm-weight').addEventListener('input', function() {
        document.getElementById('lstm-weight-value').textContent = this.value + "%";
    });
    
    document.getElementById('hybrid-weight').addEventListener('input', function() {
        document.getElementById('hybrid-weight-value').textContent = this.value + "%";
    });
    
    document.getElementById('hybrid-lgbm-nn-weight').addEventListener('input', function() {
        document.getElementById('hybrid-lgbm-nn-weight-value').textContent = this.value + "%";
    });
    
    document.getElementById('hybrid-lgbm-lstm-weight').addEventListener('input', function() {
        document.getElementById('hybrid-lgbm-lstm-weight-value').textContent = this.value + "%";
    });
    
    document.getElementById('bayesian-weight').addEventListener('input', function() {
        document.getElementById('bayesian-weight-value').textContent = this.value + "%";
    });

    document.getElementById('apply-weights').addEventListener('click', function() {
        const xgboostWeight = parseInt(document.getElementById('xgboost-weight').value);
        const lightgbmWeight = parseInt(document.getElementById('lightgbm-weight').value);
        const neuralnetWeight = parseInt(document.getElementById('neuralnet-weight').value);
        const lstmWeight = parseInt(document.getElementById('lstm-weight').value);
        const hybridWeight = parseInt(document.getElementById('hybrid-weight').value);
        const hybridLGBMNNWeight = parseInt(document.getElementById('hybrid-lgbm-nn-weight').value);
        const hybridLGBMLSTMWeight = parseInt(document.getElementById('hybrid-lgbm-lstm-weight').value);
        const bayesianWeight = parseInt(document.getElementById('bayesian-weight').value);
        
        // Recalculate consensus predictions with new weights
        const updatedConsensus = recalculateConsensus(xgboostWeight, lightgbmWeight, neuralnetWeight, lstmWeight, hybridWeight, hybridLGBMNNWeight, hybridLGBMLSTMWeight, bayesianWeight);
        
        // Update the display
        if (updatedConsensus && updatedConsensus.length > 0) {
            updateConsensusResults(updatedConsensus, 
                xgboostPredictions, lightgbmPredictions, neuralnetPredictions, 
                lstmPredictions, hybridPredictions, hybridLGBMNNPredictions, hybridLGBMLSTMPredictions, processedData);
        }
    });

    // Load and process data
    document.getElementById('loadData').addEventListener('click', async function() {
        const file1 = document.getElementById('file1').files[0];
        const file2 = document.getElementById('file2').files[0];
        
        if (!file1 || !file2) {
            alert('Por favor, seleccione ambos archivos antes de continuar.');
            return;
        }
        
        // Validar nombres de archivos
        const file1Name = file1.name.toLowerCase();
        const file2Name = file2.name.toLowerCase();
        
        if (!file1Name.includes('prohoy') && !file1Name.includes('astroluna')) {
            if (!confirm('El primer archivo no parece ser ProHOY-ASTROLUNA.csv. ¿Desea continuar de todos modos?')) {
                return;
            }
        }
        
        if (!file2Name.includes('proinv') && !file2Name.includes('astroluna')) {
            if (!confirm('El segundo archivo no parece ser ProInvHOY-ASTROLUNA.csv. ¿Desea continuar de todos modos?')) {
                return;
            }
        }
        
        showLoading();
        
        try {
            console.log('Iniciando carga de archivos...');
            
            // Read and parse files
            file1Data = await readFile(file1);
            file2Data = await readFile(file2);
            
            console.log('Archivos leídos exitosamente');
            console.log('Archivo 1:', file1Data.length, 'filas');
            console.log('Archivo 2:', file2Data.length, 'filas');
            
            // Validar que los archivos tienen datos
            if (!file1Data || file1Data.length === 0) {
                throw new Error('El primer archivo está vacío o no se pudo procesar.');
            }
            
            if (!file2Data || file2Data.length === 0) {
                throw new Error('El segundo archivo está vacío o no se pudo procesar.');
            }
            
            // Process data
            processedData = processData(file1Data, file2Data);
            
            // Mostrar información sobre las columnas detectadas
            const columns = processedData.columns;
            console.log('Columnas detectadas:');
            console.log('- Archivo 1:', columns.file1);
            console.log('- Archivo 2:', columns.file2);
            console.log('- Dataset combinado:', columns.combined);
            
            // Verificar que las variables objetivo estén disponibles (solo variables de dos cifras)
            const targetVariables = ['DC', 'EXT', 'ULT2', 'PM2', 'C1C3', 'C2C4'];
            const availableTargets = targetVariables.filter(var1 => 
                columns.combined.includes(var1)
            );
            
            if (availableTargets.length === 0) {
                console.warn('No se encontraron las variables objetivo esperadas.');
                console.warn('Variables esperadas:', targetVariables);
                console.warn('Variables disponibles:', columns.combined);
            }
            
            hideLoading();
            
            // Mostrar estadísticas de DC si está disponible
            if (availableTargets.includes('DC')) {
                showDCStats(processedData);
            }
            
            // Mostrar mensaje de éxito con información detallada
            const dcMessage = availableTargets.includes('DC') ? 
                `\n🔢 Variable DC calculada correctamente (rango 10-99)` : '';
                
            const message = `Datos cargados correctamente!\n\n` +
                          `📊 Información del dataset:\n` +
                          `• Archivo 1: ${file1Data.length} filas\n` +
                          `• Archivo 2: ${file2Data.length} filas\n` +
                          `• Dataset procesado: ${processedData.processedData.length} observaciones\n` +
                          `• Variables disponibles: ${availableTargets.join(', ')}${dcMessage}\n\n` +
                          `✅ Puede ejecutar los modelos ahora.`;
            
            alert(message);
            
            // Actualizar dropdown con variables disponibles
            updateVariableDropdown(availableTargets);
            
        } catch (error) {
            hideLoading();
            console.error('Error loading data:', error);
            
            let errorMessage = 'Error al cargar los datos:\n\n';
            
            if (error.message.includes('formato')) {
                errorMessage += '❌ Formato de archivo no válido.\n' +
                              'Por favor, verifique que los archivos sean CSV o Excel válidos.';
            } else if (error.message.includes('vacío')) {
                errorMessage += '❌ Archivo vacío o sin datos.\n' +
                              'Por favor, verifique que los archivos contengan datos.';
            } else {
                errorMessage += `❌ ${error.message}\n\n` +
                              '💡 Sugerencias:\n' +
                              '• Verifique que los archivos no estén corruptos\n' +
                              '• Asegúrese de que los archivos tengan las columnas esperadas\n' +
                              '• Intente con archivos CSV en lugar de Excel';
            }
            
            alert(errorMessage);
        }
    });

    // Run models
    document.getElementById('runModels').addEventListener('click', async function() {
        if (!processedData) {
            alert('Por favor, cargue y procese los datos primero.');
            return;
        }
        
        const button = this;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Ejecutando...';
        
        showLoading();
        
        try {
            // FORZAR DC COMO VARIABLE OBJETIVO PRINCIPAL
            const varSelection = 'DC'; // SIEMPRE usar DC
            const iterations = parseInt(document.getElementById('iterations').value);
            const numIndices = parseInt(document.getElementById('numIndices').value);
            const numThreads = parseInt(document.getElementById('numThreads').value);
            const maxDepth = parseInt(document.getElementById('maxDepth').value);
            const learningRate = parseFloat(document.getElementById('learningRate').value);
            const forecastDays = parseInt(document.getElementById('forecastDays').value);
            
            console.log('🔢 USANDO DC COMO VARIABLE OBJETIVO PRINCIPAL');
            console.log('Configuración de modelos:', {
                varSelection, iterations, numIndices, numThreads, 
                maxDepth, learningRate, forecastDays
            });
            
            // Prepare data for models - ESPECIFICAR DC EXPLÍCITAMENTE
            console.log('Preparando datos para modelos con DC...');
            const modelData = prepareDataForModels(processedData, 'DC', forecastDays);
            
            console.log('Datos preparados exitosamente');
            
            // Ejecutar modelos secuencialmente para evitar problemas de memoria
            console.log('🚀 Iniciando XGBoost...');
            const xgboostResults = await runXGBoostModel(modelData, iterations, maxDepth, learningRate);
            updateXGBoostResults(xgboostResults, modelData);
            console.log('✅ XGBoost completado');
            
            console.log('🚀 Iniciando LightGBM...');
            const lightgbmResults = await runLightGBMModel(modelData, iterations, maxDepth, learningRate);
            updateLightGBMResults(lightgbmResults, modelData);
            console.log('✅ LightGBM completado');
            
            console.log('🚀 Iniciando Red Neuronal...');
            const neuralNetResults = await runNeuralNetModel(modelData, Math.min(iterations, 100)); // Limitar épocas
            updateNeuralNetResults(neuralNetResults, modelData);
            console.log('✅ Red Neuronal completada');
            
            console.log('🚀 Iniciando LSTM...');
            const lstmResults = await runLSTMModel(modelData, Math.min(iterations, 80)); // Limitar épocas para LSTM
            updateLSTMResults(lstmResults, modelData);
            console.log('✅ LSTM completado');
            
            console.log('🚀 Iniciando Modelo Híbrido (LSTM + NeuralNet)...');
            const hybridResults = await runHybridModel(modelData, lstmResults, neuralNetResults, iterations);
            updateHybridResults(hybridResults, modelData);
            console.log('✅ Modelo Híbrido LSTM+NN completado');
            
            console.log('🚀 Iniciando Modelo Híbrido (LightGBM + NeuralNet)...');
            const hybridLGBMNNResults = await runHybridLGBMNNModel(modelData, lightgbmResults, neuralNetResults, iterations);
            updateHybridLGBMNNResults(hybridLGBMNNResults, modelData);
            console.log('✅ Modelo Híbrido LGBM+NN completado');
            
            console.log('🚀 Iniciando Modelo Híbrido (LightGBM + LSTM)...');
            const hybridLGBMLSTMResults = await runHybridLGBMLSTMModel(modelData, lightgbmResults, lstmResults, iterations);
            updateHybridLGBMLSTMResults(hybridLGBMLSTMResults, modelData);
            console.log('✅ Modelo Híbrido LGBM+LSTM completado');
            
            console.log('🚀 Iniciando Modelo Bayesiano...');
            console.log('Función runBayesianModel disponible:', typeof runBayesianModel);
            const bayesianResults = await runBayesianModel(modelData, iterations);
            console.log('Resultado del modelo bayesiano:', bayesianResults);
            console.log('Es array?', Array.isArray(bayesianResults));
            console.log('Longitud:', bayesianResults ? bayesianResults.length : 'N/A');
            updateBayesianResults(bayesianResults, modelData);
            console.log('✅ Modelo Bayesiano completado');
            
            console.log('🚀 Calculando Consenso...');
            const consensusResults = calculateConsensus(xgboostResults, lightgbmResults, neuralNetResults, lstmResults, hybridResults, hybridLGBMNNResults, hybridLGBMLSTMResults, bayesianResults);
            updateConsensusResults(consensusResults, xgboostResults, lightgbmResults, neuralNetResults, lstmResults, hybridResults, hybridLGBMNNResults, hybridLGBMLSTMResults, bayesianResults, modelData);
            console.log('✅ Consenso completado');
            
            // Store predictions
            xgboostPredictions = xgboostResults;
            lightgbmPredictions = lightgbmResults;
            neuralnetPredictions = neuralNetResults;
            lstmPredictions = lstmResults;
            hybridPredictions = hybridResults;
            hybridLGBMNNPredictions = hybridLGBMNNResults;
            hybridLGBMLSTMPredictions = hybridLGBMLSTMResults;
            bayesianPredictions = bayesianResults;
            consensusPredictions = consensusResults;
            
            hideLoading();
            
            // Mostrar mensaje de éxito
            const successMessage = `🎉 ¡Pronósticos completados exitosamente!\n\n` +
                                 `📈 Modelos ejecutados:\n` +
                                 `• XGBoost: ${xgboostResults.length} predicciones\n` +
                                 `• LightGBM: ${lightgbmResults.length} predicciones\n` +
                                 `• Redes Neuronales: ${neuralNetResults.length} predicciones\n` +
                                 `• LSTM: ${lstmResults.length} predicciones\n` +
                                 `• Modelo Híbrido (LSTM+NN): ${hybridResults.length} predicciones\n` +
                                 `• Modelo Híbrido (LGBM+NN): ${hybridLGBMNNResults.length} predicciones\n` +
                                 `• Modelo Híbrido (LGBM+LSTM): ${hybridLGBMLSTMResults.length} predicciones\n` +
                                 `• Modelo Bayesiano: ${bayesianResults.length} predicciones\n` +
                                 `• Consenso: ${consensusResults.length} predicciones\n\n` +
                                 `🔍 Variable analizada: ${varSelection}\n` +
                                 `📅 Pronóstico para los próximos ${forecastDays} días\n\n` +
                                 `✨ Explore los resultados en las pestañas de cada modelo.`;
            
            alert(successMessage);
            
        } catch (error) {
            hideLoading();
            console.error('Error running models:', error);
            
            let errorMessage = '❌ Error al ejecutar los modelos:\n\n';
            
            if (error.message.includes('Datos insuficientes')) {
                errorMessage += `${error.message}\n\n` +
                              '💡 Sugerencias:\n' +
                              '• Verifique que la variable seleccionada tenga datos válidos\n' +
                              '• Intente con una variable diferente\n' +
                              '• Revise que los archivos CSV contengan las columnas esperadas';
            } else if (error.message.includes('memoria') || error.message.includes('memory')) {
                errorMessage += 'Problema de memoria durante el entrenamiento.\n\n' +
                              '💡 Sugerencias:\n' +
                              '• Reduzca el número de iteraciones\n' +
                              '• Cierre otras pestañas del navegador\n' +
                              '• Intente con un dataset más pequeño';
            } else {
                errorMessage += `${error.message}\n\n` +
                              '💡 Revise la consola del navegador para más detalles.';
            }
            
            alert(errorMessage);
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    });
    
    // Test button for Bayesian model
    const testBayesianBtn = document.getElementById('test-bayesian-btn');
    console.log('🔍 Botón test-bayesian-btn encontrado:', !!testBayesianBtn);
    
    if (testBayesianBtn) {
        testBayesianBtn.addEventListener('click', async function() {
            console.log('🧪 Iniciando prueba del modelo bayesiano...');
            
            const button = this;
            const originalText = button.textContent;
            const statusDiv = document.getElementById('bayesian-test-status');
            
            button.disabled = true;
            button.textContent = '🔄 Probando...';
            
            if (statusDiv) {
                statusDiv.classList.remove('hidden');
                statusDiv.innerHTML = '<div class="text-blue-600"><i class="fas fa-spinner fa-spin mr-1"></i>Ejecutando modelo bayesiano...</div>';
            }
        
        try {
            // Execute the test function
            const results = await testBayesianModel();
            
            button.textContent = '✅ Prueba Completada';
            
            if (statusDiv && results && results.length > 0) {
                const testResults = results.filter(r => r.actual !== null);
                const futureResults = results.filter(r => r.actual === null);
                
                statusDiv.innerHTML = `
                    <div class="text-green-600">
                        <i class="fas fa-check-circle mr-1"></i>
                        <strong>Prueba exitosa:</strong> ${results.length} predicciones generadas
                        <br>
                        <span class="text-xs">
                            ${testResults.length} resultados de prueba, ${futureResults.length} pronósticos futuros
                        </span>
                    </div>
                `;
            }
            
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
                if (statusDiv) {
                    statusDiv.classList.add('hidden');
                }
            }, 5000);
            
        } catch (error) {
            console.error('Error en prueba bayesiana:', error);
            button.textContent = '❌ Error en Prueba';
            
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div class="text-red-600">
                        <i class="fas fa-exclamation-triangle mr-1"></i>
                        <strong>Error:</strong> ${error.message || 'Error desconocido'}
                    </div>
                `;
            }
            
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
                if (statusDiv) {
                    statusDiv.classList.add('hidden');
                }
            }, 5000);
        }
        });
    } else {
        console.error('❌ Botón test-bayesian-btn no encontrado en el DOM');
    }
});

// Función para actualizar el dropdown de variables con las variables disponibles
function updateVariableDropdown(availableVariables) {
    const dropdown = document.getElementById('varSelection');
    if (!dropdown) {
        console.warn('⚠️ Dropdown varSelection no encontrado');
        return;
    }
    
    // Limpiar opciones actuales
    dropdown.innerHTML = '';
    
    // Definir nombres descriptivos para las variables (solo dos cifras)
    const variableNames = {
        'DC': 'DC - Dígito Clave (10-99)',
        'EXT': 'EXT - Extensión (10-99)',
        'ULT2': 'ULT2 - Último Dos (10-99)',
        'PM2': 'PM2 - Prima Dos (10-99)',
        'C1C3': 'C1C3 - Combinación 1-3 (10-99)',
        'C2C4': 'C2C4 - Combinación 2-4 (10-99)'
    };
    
    // Agregar opciones para las variables disponibles
    availableVariables.forEach(variable => {
        const option = document.createElement('option');
        option.value = variable;
        option.textContent = variableNames[variable] || variable;
        
        // Seleccionar DC por defecto si está disponible
        if (variable === 'DC') {
            option.selected = true;
        }
        
        dropdown.appendChild(option);
    });
    
    console.log('✅ Dropdown actualizado con variables:', availableVariables);
}
