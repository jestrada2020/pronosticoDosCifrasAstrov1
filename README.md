# ASTROLUNA Premium - Estructura de Archivos

## Archivos separados por funcionalidad

### 1. **styles.css**
Contiene todos los estilos CSS de la aplicación:
- Estilos base del cuerpo
- Estilos para pestañas y contenido
- Animaciones y transiciones
- Estilos para tablas y gráficos
- Estilos del spinner de carga

### 2. **main.js**
Funciones principales y utilidades:
- Variables globales
- Funciones de carga de archivos
- Procesamiento de datos
- Preparación de datos para modelos
- Funciones de utilidad (MSE, MAE)

### 3. **xgboost.js**
Modelo XGBoost:
- Función `runXGBoostModel()`
- Función `updateXGBoostResults()`
- Lógica específica del algoritmo XGBoost

### 4. **lightgbm.js**
Modelo LightGBM:
- Función `runLightGBMModel()`
- Función `updateLightGBMResults()`
- Lógica específica del algoritmo LightGBM

### 5. **neuralnet.js**
Modelo de Redes Neuronales:
- Función `runNeuralNetModel()`
- Función `updateNeuralNetResults()`
- Lógica específica de redes neuronales

### 6. **hybrid.js**
Modelo Híbrido:
- Función `runHybridModel()`
- Función `updateHybridResults()`
- Combinación de LightGBM + Redes Neuronales

### 7. **consensus.js**
Modelo de Consenso:
- Función `calculateConsensus()`
- Función `recalculateConsensus()`
- Función `updateConsensusResults()`
- Combinación ponderada de todos los modelos

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
6. consensus.js
7. events.js (manejadores de eventos)
