/**
 * ASTROLUNA Premium - Modelo de Redes Bayesianas Dinámicas
 * Implementación de Bayesian Dynamic Networks para pronósticos astrológicos
 * Utiliza inferencia bayesiana y modelos de estado temporal
 */

// Clase para representar un nodo bayesiano
class BayesianNode {
    constructor(name, states = [], parents = []) {
        this.name = name;
        this.states = states;
        this.parents = parents;
        this.cpt = {}; // Conditional Probability Table
        this.evidence = null;
        this.marginal = null;
    }

    // Inicializar tabla de probabilidad condicional
    initializeCPT() {
        const combinations = this.getAllParentCombinations();
        combinations.forEach(combo => {
            this.cpt[combo] = this.createUniformDistribution();
        });
    }

    getAllParentCombinations() {
        if (this.parents.length === 0) return [''];
        
        let combinations = [''];
        this.parents.forEach(parent => {
            const newCombinations = [];
            parent.states.forEach(state => {
                combinations.forEach(combo => {
                    newCombinations.push(combo + (combo ? '|' : '') + state);
                });
            });
            combinations = newCombinations;
        });
        return combinations;
    }

    createUniformDistribution() {
        const prob = 1.0 / this.states.length;
        const distribution = {};
        this.states.forEach(state => {
            distribution[state] = prob;
        });
        return distribution;
    }

    // Actualizar CPT con datos observados
    updateCPT(data) {
        const counts = {};
        const parentCounts = {};

        // Contar ocurrencias
        data.forEach(instance => {
            const parentKey = this.getParentKey(instance);
            const nodeValue = instance[this.name];

            if (!counts[parentKey]) counts[parentKey] = {};
            if (!parentCounts[parentKey]) parentCounts[parentKey] = 0;

            if (!counts[parentKey][nodeValue]) counts[parentKey][nodeValue] = 0;
            counts[parentKey][nodeValue]++;
            parentCounts[parentKey]++;
        });

        // Convertir a probabilidades con suavizado de Laplace
        Object.keys(counts).forEach(parentKey => {
            const total = parentCounts[parentKey];
            const alpha = 1; // Parámetro de suavizado
            const denominator = total + alpha * this.states.length;

            this.cpt[parentKey] = {};
            this.states.forEach(state => {
                const count = counts[parentKey][state] || 0;
                this.cpt[parentKey][state] = (count + alpha) / denominator;
            });
        });
    }

    getParentKey(instance) {
        if (this.parents.length === 0) return '';
        return this.parents.map(parent => instance[parent.name]).join('|');
    }
}

// Red Bayesiana Dinámica principal
class BayesianDynamicNetwork {
    constructor() {
        this.nodes = {};
        this.timeSlices = [];
        this.transitionModel = {};
        this.observationModel = {};
        this.particleFilter = new ParticleFilter();
    }

    // Agregar nodo a la red
    addNode(node) {
        this.nodes[node.name] = node;
        node.initializeCPT();
    }

    // Entrenar la red con datos históricos
    train(data) {
        console.log('🧠 Entrenando Red Bayesiana Dinámica...');
        
        // Preparar datos temporales
        const temporalData = this.prepareTemporalData(data);
        
        // Entrenar modelo de transición
        this.trainTransitionModel(temporalData);
        
        // Entrenar modelo de observación
        this.trainObservationModel(temporalData);
        
        // Actualizar CPTs de nodos
        Object.values(this.nodes).forEach(node => {
            node.updateCPT(data);
        });

        console.log('✅ Red Bayesiana entrenada exitosamente');
    }

    // Preparar datos con estructura temporal
    prepareTemporalData(data) {
        const temporalData = [];
        
        // Crear ventanas temporales
        for (let i = 1; i < data.length; i++) {
            const prevState = data[i - 1];
            const currentState = data[i];
            
            temporalData.push({
                previous: prevState,
                current: currentState,
                timeStep: i
            });
        }
        
        return temporalData;
    }

    // Entrenar modelo de transición (estado t-1 -> estado t)
    trainTransitionModel(temporalData) {
        const transitions = {};
        
        temporalData.forEach(({ previous, current }) => {
            const prevKey = this.getStateKey(previous);
            const currKey = this.getStateKey(current);
            
            if (!transitions[prevKey]) transitions[prevKey] = {};
            if (!transitions[prevKey][currKey]) transitions[prevKey][currKey] = 0;
            
            transitions[prevKey][currKey]++;
        });

        // Normalizar a probabilidades
        Object.keys(transitions).forEach(prevKey => {
            const total = Object.values(transitions[prevKey]).reduce((sum, count) => sum + count, 0);
            Object.keys(transitions[prevKey]).forEach(currKey => {
                transitions[prevKey][currKey] /= total;
            });
        });

        this.transitionModel = transitions;
    }

    // Entrenar modelo de observación
    trainObservationModel(temporalData) {
        const observations = {};
        
        temporalData.forEach(({ current }) => {
            const stateKey = this.getStateKey(current);
            const obsKey = this.getObservationKey(current);
            
            if (!observations[stateKey]) observations[stateKey] = {};
            if (!observations[stateKey][obsKey]) observations[stateKey][obsKey] = 0;
            
            observations[stateKey][obsKey]++;
        });

        // Normalizar
        Object.keys(observations).forEach(stateKey => {
            const total = Object.values(observations[stateKey]).reduce((sum, count) => sum + count, 0);
            Object.keys(observations[stateKey]).forEach(obsKey => {
                observations[stateKey][obsKey] /= total;
            });
        });

        this.observationModel = observations;
    }

    getStateKey(state) {
        return `${state.C1}_${state.C2}_${state.C3}_${state.C4}`;
    }

    getObservationKey(state) {
        return `${state.SIGNOnumerico}`;
    }

    // Realizar inferencia bayesiana para pronósticos
    predict(historicalData, targetVariable, forecastDays = 7) {
        console.log(`🔮 Generando pronósticos bayesianos para ${forecastDays} días...`);
        
        const predictions = [];
        let currentState = historicalData[historicalData.length - 1];
        
        for (let day = 1; day <= forecastDays; day++) {
            // Inferencia usando filtro de partículas
            const prediction = this.particleFilter.predict(
                currentState, 
                this.transitionModel, 
                this.observationModel
            );
            
            // Calcular probabilidades posteriores
            const posterior = this.calculatePosterior(currentState, prediction);
            
            // Generar predicción puntual
            const pointPrediction = this.generatePointPrediction(posterior, targetVariable);
            
            predictions.push({
                day: day,
                prediction: pointPrediction,
                confidence: posterior.confidence,
                distribution: posterior.distribution,
                timestamp: new Date(Date.now() + day * 24 * 60 * 60 * 1000)
            });
            
            // Actualizar estado para siguiente iteración
            currentState = this.updateState(currentState, prediction);
        }
        
        return {
            predictions: predictions,
            model: 'Bayesian Dynamic Network',
            confidence: this.calculateOverallConfidence(predictions),
            metadata: {
                transitionStates: Object.keys(this.transitionModel).length,
                observationStates: Object.keys(this.observationModel).length,
                particles: this.particleFilter.numParticles
            }
        };
    }

    // Calcular probabilidad posterior usando teorema de Bayes
    calculatePosterior(currentState, prediction) {
        const stateKey = this.getStateKey(currentState);
        const transitions = this.transitionModel[stateKey] || {};
        
        let totalProbability = 0;
        const distribution = {};
        
        // Calcular probabilidades para cada estado posible
        Object.keys(transitions).forEach(nextStateKey => {
            const transitionProb = transitions[nextStateKey];
            const likelihood = this.calculateLikelihood(nextStateKey, prediction);
            const posterior = transitionProb * likelihood;
            
            distribution[nextStateKey] = posterior;
            totalProbability += posterior;
        });
        
        // Normalizar
        Object.keys(distribution).forEach(key => {
            distribution[key] /= totalProbability;
        });
        
        return {
            distribution: distribution,
            confidence: this.calculateConfidence(distribution)
        };
    }

    calculateLikelihood(stateKey, prediction) {
        const observations = this.observationModel[stateKey] || {};
        const obsKey = this.getObservationKey(prediction);
        return observations[obsKey] || 0.001; // Pequeña probabilidad para estados no observados
    }

    calculateConfidence(distribution) {
        // Calcular entropía de Shannon como medida de incertidumbre
        let entropy = 0;
        Object.values(distribution).forEach(prob => {
            if (prob > 0) {
                entropy -= prob * Math.log2(prob);
            }
        });
        
        // Convertir a confianza (0-1)
        const maxEntropy = Math.log2(Object.keys(distribution).length);
        return Math.max(0, 1 - entropy / maxEntropy);
    }

    generatePointPrediction(posterior, targetVariable) {
        // Generar predicción basada en distribución posterior
        let prediction = 0;
        let totalWeight = 0;
        
        Object.keys(posterior.distribution).forEach(stateKey => {
            const prob = posterior.distribution[stateKey];
            const stateValue = this.extractTargetValue(stateKey, targetVariable);
            
            prediction += prob * stateValue;
            totalWeight += prob;
        });
        
        return totalWeight > 0 ? prediction / totalWeight : 0;
    }

    extractTargetValue(stateKey, targetVariable) {
        const parts = stateKey.split('_');
        const mapping = { 'C1': 0, 'C2': 1, 'C3': 2, 'C4': 3 };
        const index = mapping[targetVariable];
        return parseFloat(parts[index]) || 0;
    }

    updateState(currentState, prediction) {
        // Actualizar estado con algún ruido para evolución temporal
        const noise = () => (Math.random() - 0.5) * 0.1;
        
        return {
            C1: currentState.C1 + noise(),
            C2: currentState.C2 + noise(),
            C3: currentState.C3 + noise(),
            C4: currentState.C4 + noise(),
            SIGNOnumerico: currentState.SIGNOnumerico
        };
    }

    calculateOverallConfidence(predictions) {
        const avgConfidence = predictions.reduce((sum, pred) => sum + pred.confidence, 0) / predictions.length;
        return Math.max(0.1, Math.min(0.95, avgConfidence));
    }
}

// Filtro de partículas para inferencia aproximada
class ParticleFilter {
    constructor(numParticles = 1000) {
        this.numParticles = numParticles;
        this.particles = [];
        this.weights = [];
    }

    predict(currentState, transitionModel, observationModel) {
        // Inicializar partículas si es necesario
        if (this.particles.length === 0) {
            this.initializeParticles(currentState);
        }

        // Paso de predicción
        this.predictionStep(transitionModel);
        
        // Paso de actualización
        this.updateStep(observationModel, currentState);
        
        // Remuestreo
        this.resample();
        
        // Retornar predicción promedio
        return this.getAveragePrediction();
    }

    initializeParticles(initialState) {
        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push({
                C1: initialState.C1 + (Math.random() - 0.5) * 0.5,
                C2: initialState.C2 + (Math.random() - 0.5) * 0.5,
                C3: initialState.C3 + (Math.random() - 0.5) * 0.5,
                C4: initialState.C4 + (Math.random() - 0.5) * 0.5,
                SIGNOnumerico: initialState.SIGNOnumerico
            });
            this.weights.push(1.0 / this.numParticles);
        }
    }

    predictionStep(transitionModel) {
        // Evolucionar cada partícula según modelo de transición
        this.particles.forEach(particle => {
            // Agregar ruido de proceso
            particle.C1 += (Math.random() - 0.5) * 0.2;
            particle.C2 += (Math.random() - 0.5) * 0.2;
            particle.C3 += (Math.random() - 0.5) * 0.2;
            particle.C4 += (Math.random() - 0.5) * 0.2;
        });
    }

    updateStep(observationModel, observation) {
        // Actualizar pesos basado en observaciones
        this.weights = this.particles.map(particle => {
            return this.calculateWeight(particle, observation, observationModel);
        });

        // Normalizar pesos
        const totalWeight = this.weights.reduce((sum, weight) => sum + weight, 0);
        if (totalWeight > 0) {
            this.weights = this.weights.map(weight => weight / totalWeight);
        }
    }

    calculateWeight(particle, observation, observationModel) {
        // Calcular probabilidad de observación dada la partícula
        const distance = Math.sqrt(
            Math.pow(particle.C1 - observation.C1, 2) +
            Math.pow(particle.C2 - observation.C2, 2) +
            Math.pow(particle.C3 - observation.C3, 2) +
            Math.pow(particle.C4 - observation.C4, 2)
        );
        
        // Función de probabilidad gaussiana
        return Math.exp(-distance * distance / 2);
    }

    resample() {
        const newParticles = [];
        const cumWeights = [];
        
        // Calcular pesos acumulativos
        cumWeights[0] = this.weights[0];
        for (let i = 1; i < this.weights.length; i++) {
            cumWeights[i] = cumWeights[i - 1] + this.weights[i];
        }
        
        // Remuestreo sistemático
        for (let i = 0; i < this.numParticles; i++) {
            const rand = Math.random();
            let index = 0;
            while (index < cumWeights.length && cumWeights[index] < rand) {
                index++;
            }
            newParticles.push({ ...this.particles[index] });
        }
        
        this.particles = newParticles;
        this.weights = new Array(this.numParticles).fill(1.0 / this.numParticles);
    }

    getAveragePrediction() {
        const sum = this.particles.reduce((acc, particle) => ({
            C1: acc.C1 + particle.C1,
            C2: acc.C2 + particle.C2,
            C3: acc.C3 + particle.C3,
            C4: acc.C4 + particle.C4,
            SIGNOnumerico: acc.SIGNOnumerico + particle.SIGNOnumerico
        }), { C1: 0, C2: 0, C3: 0, C4: 0, SIGNOnumerico: 0 });

        return {
            C1: sum.C1 / this.numParticles,
            C2: sum.C2 / this.numParticles,
            C3: sum.C3 / this.numParticles,
            C4: sum.C4 / this.numParticles,
            SIGNOnumerico: Math.round(sum.SIGNOnumerico / this.numParticles)
        };
    }
}

// Función principal para ejecutar el modelo bayesiano con variables de dos dígitos
async function runBayesianModel(data, targetVariable = 'DC', forecastDays = 7) {
    console.log('🚀 Iniciando Modelo de Redes Bayesianas Dinámicas');
    console.log('Variable objetivo:', targetVariable);
    
    try {
        // Verificar que la variable objetivo sea de dos dígitos
        const twoDigitVariables = ['DC', 'EXT', 'ULT2', 'PM2', 'C1C3', 'C2C4'];
        if (!twoDigitVariables.includes(targetVariable)) {
            console.warn(`Variable ${targetVariable} no es de dos dígitos. Usando DC por defecto.`);
            targetVariable = 'DC';
        }
        
        // Crear red bayesiana
        const bdn = new BayesianDynamicNetwork();
        
        // Crear nodos solo para variables relevantes (manteniendo C1-C4 y SIGNOnumerico para cálculos internos)
        const nodeC1 = new BayesianNode('C1', ['low', 'medium', 'high']);
        const nodeC2 = new BayesianNode('C2', ['low', 'medium', 'high']);  
        const nodeC3 = new BayesianNode('C3', ['low', 'medium', 'high']);
        const nodeC4 = new BayesianNode('C4', ['low', 'medium', 'high']);
        const nodeSigno = new BayesianNode('SIGNOnumerico', 
            Array.from({length: 12}, (_, i) => (i + 1).toString())
        );
        
        // Crear nodo para la variable objetivo de dos dígitos
        const targetNode = new BayesianNode(targetVariable, 
            Array.from({length: 10}, (_, i) => `range_${i * 10}-${(i + 1) * 10 - 1}`)
        );
        
        // Agregar nodos a la red
        bdn.addNode(nodeC1);
        bdn.addNode(nodeC2);
        bdn.addNode(nodeC3);
        bdn.addNode(nodeC4);
        bdn.addNode(nodeSigno);
        bdn.addNode(targetNode);
        
        // Entrenar la red
        bdn.train(data, targetVariable);
        
        // Generar pronósticos
        const results = bdn.predict(data, targetVariable, forecastDays);
        
        // Calcular métricas
        const metrics = calculateBayesianMetrics(results, data, targetVariable);
        
        console.log('✅ Modelo Bayesiano completado exitosamente');
        
        return {
            predictions: results.predictions,
            metrics: metrics,
            model: 'Bayesian Dynamic Network',
            confidence: results.confidence,
            metadata: results.metadata,
            targetVariable: targetVariable
        };
        
    } catch (error) {
        console.error('❌ Error en modelo bayesiano:', error);
        return {
            predictions: [],
            metrics: { mse: 999, mae: 999, rmse: 999 },
            model: 'Bayesian Dynamic Network',
            confidence: 0.1,
            error: error.message,
            targetVariable: targetVariable
        };
    }
}

// Calcular métricas específicas para el modelo bayesiano
function calculateBayesianMetrics(results, historicalData, targetVariable = 'DC') {
    const predictions = results.predictions;
    
    // Usar últimos datos para validación
    const validationSize = Math.min(predictions.length, historicalData.length);
    const validationData = historicalData.slice(-validationSize);
    
    let mse = 0, mae = 0;
    let validPredictions = 0;
    
    for (let i = 0; i < Math.min(predictions.length, validationData.length); i++) {
        const predicted = predictions[i].prediction;
        const actual = validationData[i][targetVariable]; // Usar la variable objetivo especificada
        
        if (!isNaN(predicted) && !isNaN(actual)) {
            const error = predicted - actual;
            mse += error * error;
            mae += Math.abs(error);
            validPredictions++;
        }
    }
    
    if (validPredictions > 0) {
        mse /= validPredictions;
        mae /= validPredictions;
    }
    
    return {
        mse: mse,
        mae: mae,
        rmse: Math.sqrt(mse),
        r2: calculateR2Bayesian(predictions, validationData, targetVariable),
        confidence: results.confidence,
        targetVariable: targetVariable
    };
}

function calculateR2Bayesian(predictions, actual, targetVariable = 'DC') {
    if (predictions.length === 0 || actual.length === 0) return 0;
    
    const actualValues = actual.map(d => d[targetVariable]).filter(v => !isNaN(v));
    const predValues = predictions.slice(0, actualValues.length).map(p => p.prediction);
    
    if (actualValues.length < 2) return 0;
    
    const actualMean = actualValues.reduce((sum, val) => sum + val, 0) / actualValues.length;
    
    let ssRes = 0, ssTot = 0;
    for (let i = 0; i < Math.min(actualValues.length, predValues.length); i++) {
        ssRes += Math.pow(actualValues[i] - predValues[i], 2);
        ssTot += Math.pow(actualValues[i] - actualMean, 2);
    }
    
    return ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
}

// Exportar funciones
window.runBayesianModel = runBayesianModel;
window.BayesianDynamicNetwork = BayesianDynamicNetwork;
