# ASTROLUNA Premium - Aplicación de Pronósticos Astrológicos

## 🌟 Nuevas Características (Versión Mejorada)

### Variables Predictivas Simplificadas
La aplicación ahora se enfoca en las 5 variables astrológicas principales:
- **C1** - Primera Columna
- **C2** - Segunda Columna  
- **C3** - Tercera Columna
- **C4** - Cuarta Columna
- **Signo Numérico** - Correspondencia numérica de los signos zodiacales

### Procesamiento Real de Datos
✅ **Implementado**: La aplicación ahora procesa realmente los archivos CSV cargados
- Lectura y parseo automático de archivos CSV/Excel
- Validación de formato y contenido
- Limpieza y normalización de datos
- Detección automática de columnas

### Modelos de Machine Learning Mejorados
✅ **XGBoost Mejorado**: Implementa lógica de gradient boosting más realista
- Cálculo de tendencias basado en datos históricos
- Factores estacionales astrológicos
- Hiperparámetros que afectan realmente las predicciones

✅ **LSTM Avanzado**: Red neuronal recurrente con memoria a largo plazo
- Arquitectura de 2 capas LSTM con dropout
- Preparación de secuencias temporales
- Normalización específica para datos temporales
- Predicciones futuras basadas en patrones históricos

✅ **Modelo Híbrido LSTM+NeuralNet**: Combinación inteligente de dos enfoques
- Ponderación dinámica basada en confianza de cada modelo
- Análisis de tendencia, estacionalidad y varianza avanzada
- Componentes de predicción temporal y no lineal
- Funciones de fallback robustas

✅ **Modelo Híbrido LightGBM+NeuralNet**: Optimización estructural-no lineal
- Ponderación adaptativa según complejidad de datos (40-65% LGBM, 35-60% NN)
- Análisis de interacción entre modelos
- Factores estacionales astrológicos
- Fallbacks inteligentes para predicciones futuras

✅ **Modelo Híbrido LightGBM+LSTM**: Sinergia temporal-estructural
- Ponderación basada en estabilidad temporal (60-80% LSTM, 20-40% LGBM)
- Análisis de momentum temporal dinámico
- Memoria estacional adaptativa
- Decaimiento de memoria para predicciones a largo plazo

✅ **Consenso Expandido**: Ahora incluye 7 modelos
- XGBoost, LightGBM, Redes Neuronales, LSTM, 3 Híbridos
- Ponderación personalizable para cada modelo (~14.3% cada uno)
- Normalización automática de pesos
- Interface visual mejorada con controles independientes

### Características Técnicas Avanzadas

#### Modelo LSTM
- **Secuencias**: Ventanas deslizantes de 10 pasos temporales
- **Capas**: LSTM(50) → LSTM(30) → Dense(25) → Dense(10) → Output(1)
- **Regularización**: Dropout 20% regular y recurrente
- **Optimización**: Adam con learning rate 0.001

#### Modelo Híbrido LSTM+NN
- **Combinación inteligente**: Pesos dinámicos basados en confianza
- **Análisis temporal**: Tendencia lineal y exponencial
- **Estacionalidad**: Ciclos zodiacales, lunares y semanales
- **Predicciones futuras**: Métodos de fallback robustos

✅ **Redes Neuronales con TensorFlow.js**: Implementación real de deep learning
- Arquitectura: 64→32→16→1 neuronas con dropout
- Normalización Z-score de datos
- Entrenamiento adaptativo con callbacks
- Gestión eficiente de memoria GPU/CPU

✅ **Modelo Híbrido Inteligente**: Combinación optimizada de LightGBM + Redes Neuronales
- Ponderación dinámica 60/40
- Aprovecha fortalezas de ambos enfoques

### Validación y Manejo de Errores
✅ **Sistema de Validación Robusto**:
- Verificación de formato de archivos
- Validación de contenido y estructura
- Detección automática de variables objetivo
- Mensajes de error descriptivos y sugerencias

✅ **Manejo Inteligente de Errores**:
- Diagnóstico automático de problemas
- Sugerencias contextuales para resolución
- Logging detallado para debugging

### Interfaz de Usuario Mejorada
✅ **Feedback Detallado**:
- Mensajes informativos durante carga de datos
- Progreso de entrenamiento de modelos
- Estadísticas detalladas de resultados
- Información sobre calidad de datos

## 📁 Estructura de Archivos Actualizada

### Archivos Principales Mejorados:

**main.js** - Funciones principales actualizadas:
- `processData()`: Procesamiento real de CSV con validación
- `prepareDataForModels()`: Preparación inteligente de datasets
- `extractNumericFeatures()`: Detección automática de características
- Funciones de utilidad mejoradas

**xgboost.js** - Modelo XGBoost realista:
- Algoritmo de gradient boosting simulado
- Cálculo de tendencias y factores estacionales
- Hiperparámetros funcionales

**lightgbm.js** - Modelo LightGBM optimizado:
- Enfoque leaf-wise específico
- Ponderación exponencial
- Manejo avanzado de varianza

**neuralnet.js** - Redes neuronales con TensorFlow.js:
- Arquitectura profunda real
- Normalización y desnormalización automática
- Gestión de memoria optimizada
- Callbacks de entrenamiento

**events.js** - Manejo de eventos mejorado:
- Validación exhaustiva de archivos
- Manejo de errores contextual
- Feedback detallado al usuario
- Ejecución secuencial optimizada

## 🎯 Cómo Usar la Aplicación Mejorada

### 1. Preparación de Datos
- Prepare sus archivos `ProHOY-ASTROLUNA.csv` y `ProInvHOY-ASTROLUNA.csv`
- Asegúrese de que contengan las columnas: C1, C2, C3, C4, SIGNOnumerico
- Los archivos pueden ser CSV o Excel (.xlsx, .xls)

### 2. Carga de Archivos
- Seleccione ambos archivos usando los botones de carga
- La aplicación validará automáticamente el formato y contenido
- Recibirá feedback detallado sobre la calidad de los datos

### 3. Configuración de Modelos
- Seleccione la variable predictiva (C1-C4 o Signo Numérico)
- Ajuste hiperparámetros según sus necesidades:
  - **Iteraciones**: Más iteraciones = mejor precisión pero más tiempo
  - **Profundidad**: Mayor profundidad = modelos más complejos
  - **Tasa de aprendizaje**: Controla velocidad de convergencia
  - **Días de pronóstico**: 1-30 días hacia el futuro

### 4. Ejecución y Resultados
- Los modelos se ejecutan secuencialmente para optimizar memoria
- Cada modelo muestra progreso en tiempo real
- Los resultados incluyen métricas de error y visualizaciones
- El consenso combina todos los modelos inteligentemente

## 🔧 Características Técnicas

### Algoritmos Implementados:
- **XGBoost**: Gradient boosting con árboles de decisión
- **LightGBM**: Boosting optimizado leaf-wise
- **Deep Learning**: Redes neuronales con TensorFlow.js
- **Ensemble**: Modelo híbrido y consenso ponderado

### Validaciones:
- Formato de archivos (CSV/Excel)
- Integridad de datos
- Presencia de variables objetivo
- Suficiencia de datos para entrenamiento

### Optimizaciones:
- Gestión eficiente de memoria
- Normalización automática de datos
- Ejecución asíncrona no bloqueante
- Limpieza automática de recursos

## 📊 Métricas y Evaluación

La aplicación calcula automáticamente:
- **MSE** (Error Cuadrático Medio)
- **MAE** (Error Absoluto Medio)  
- **RMSE** (Raíz del Error Cuadrático Medio)
- **Visualizaciones** comparativas entre modelos

## 🚀 Próximas Mejoras Planificadas

- Exportación de resultados a CSV/Excel
- Validación cruzada automática
- Optimización de hiperparámetros
- Análisis de importancia de características
- API REST para integración externa

---

© 2025 Pronóstico ASTROLUNA Premium | Versión 3.0 - Edición Mejorada

### 8. **events.js**
Manejadores de eventos:
- Event listeners para pestañas
- Manejadores de archivos
- Event listeners para controles
- Lógica de ejecución de modelos

### 9. **AstroLuna.html**
Archivo HTML principal:
- Estructura HTML limpia
- Referencias a archivos CSS y JS externos
- Sin código inline

## Ventajas de esta separación:

1. **Mantenibilidad**: Cada algoritmo está en su propio archivo
2. **Escalabilidad**: Fácil agregar nuevos modelos
3. **Organización**: Código más limpio y organizado
4. **Reutilización**: Funciones pueden ser reutilizadas
5. **Depuración**: Más fácil encontrar y corregir errores
6. **Colaboración**: Múltiples desarrolladores pueden trabajar en diferentes algoritmos

## Orden de carga de scripts:
1. main.js (funciones base)
2. xgboost.js
3. lightgbm.js  
4. neuralnet.js
5. hybrid.js
6. lstm.js
7. hybrid_lgbm_nn.js
8. hybrid_lgbm_lstm.js
9. bayesian.js
10. consensus.js
11. events.js (manejadores de eventos)

#### Modelos Híbridos Adicionales

##### Híbrido LightGBM+NeuralNet
- **Fortalezas**: Combina gradient boosting estructurado con patrones no lineales
- **Ponderación**: Adaptativa según complejidad de datos
- **Optimización**: LGBM para datos estructurados, NN para patrones complejos
- **Factores**: Interacción entre modelos, estacionalidad astrológica

##### Híbrido LightGBM+LSTM
- **Fortalezas**: Estructura + memoria temporal a largo plazo
- **Ponderación**: Basada en estabilidad temporal
- **Optimización**: LSTM para patrones temporales, LGBM para estabilidad
- **Factores**: Sinergia temporal-estructural, momentum dinámico

### Arquitectura Completa del Sistema

La aplicación ahora incluye **8 modelos predictivos**:
1. **XGBoost** - Gradient boosting tradicional
2. **LightGBM** - Gradient boosting optimizado
3. **Redes Neuronales** - Deep learning estándar
4. **LSTM** - Memoria a largo plazo
5. **Híbrido LSTM+NN** - Temporal + no lineal
6. **Híbrido LGBM+NN** - Estructural + no lineal  
7. **Híbrido LGBM+LSTM** - Estructural + temporal
8. **Redes Bayesianas Dinámicas** - Inferencia probabilística avanzada

El **modelo de consenso** combina todos los modelos con ponderación personalizable.

#### Modelo de Redes Bayesianas Dinámicas

##### Características Técnicas
- **Tipo**: Bayesian Dynamic Networks (BDN) con inferencia temporal
- **Nodos**: Representación discreta de variables (C1, C2, C3, C4, target)
- **Estados**: Discretización en 'low', 'medium', 'high' para cada variable
- **Dependencias**: Auto-dependencia temporal del target + dependencias causales
- **Inferencia**: Algoritmo de eliminación de variables con filtro de partículas
- **Aprendizaje**: Estimación de parámetros desde datos históricos

##### Fortalezas del Modelo
- **Incertidumbre Cuantificada**: Proporciona intervalos de confianza y distribuciones de probabilidad
- **Interpretabilidad**: Estructura gráfica clara de dependencias causales
- **Manejo de Datos Faltantes**: Robusto ante valores ausentes mediante inferencia
- **Memoria Temporal**: Considera dependencias temporales entre observaciones
- **Adaptabilidad**: Aprendizaje continuo desde nuevos datos

##### Métricas Específicas
- **Probabilidad de Predicción**: Confianza en cada predicción individual
- **Intervalo de Confianza**: Banda de incertidumbre alrededor de la predicción
- **Distribución de Estados**: Probabilidades para cada estado discreto
- **Confianza Promedio**: Métrica agregada de certeza del modelo

##### Visualización Avanzada
- **Gráfico Principal**: Predicciones con intervalos de confianza
- **Distribución de Probabilidades**: Análisis de certeza por rangos
- **Métricas de Confianza**: Estadísticas de calidad de predicción
- **Pronósticos Futuros**: Predicciones con decaimiento de confianza temporal

El modelo bayesiano complementa los otros enfoques proporcionando una perspectiva probabilística única, especialmente valiosa para la toma de decisiones bajo incertidumbre.
