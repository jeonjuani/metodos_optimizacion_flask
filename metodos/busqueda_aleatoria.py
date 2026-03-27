import random
from metodos.utils import evaluar_funcion_multivariable


def _iterar(f_expr, variables, rangos, max_iter, maximizar):
    iteraciones = []
    
    # Validar consistencia
    if len(variables) != len(rangos):
        raise ValueError("Cantidad de variables no coincide con cantidad de rangos")
    
    for rango in rangos:
        if len(rango) != 2 or rango[0] >= rango[1]:
            raise ValueError("Cada rango debe ser [min, max] con min < max")
    
    # Inicializar con punto aleatorio
    punto_optimo = {}
    for var, rango in zip(variables, rangos):
        punto_optimo[var] = random.uniform(rango[0], rango[1])
    
    f_optimo = evaluar_funcion_multivariable(f_expr, punto_optimo)
    iteraciones.append({
        'iteracion': 1,
        'punto': punto_optimo.copy(),
        'valor_f': f_optimo,
    })
    
    # Búsqueda aleatoria
    for i in range(2, max_iter + 1):
        # Generar nuevo punto aleatorio
        nuevo_punto = {}
        for var, rango in zip(variables, rangos):
            nuevo_punto[var] = random.uniform(rango[0], rango[1])
        
        f_nuevo = evaluar_funcion_multivariable(f_expr, nuevo_punto)
        
        # Comparar y actualizar si es mejor
        es_mejor = (f_nuevo > f_optimo) if maximizar else (f_nuevo < f_optimo)
        
        if es_mejor:
            punto_optimo = nuevo_punto.copy()
            f_optimo = f_nuevo
        
        iteraciones.append({
            'iteracion': i,
            'punto': punto_optimo.copy(),
            'valor_f': f_optimo,
        })
    
    return iteraciones


def _generar_superficie_3d(f_expr, variables, rangos, resolucion=45):
    if len(variables) != 2 or len(rangos) != 2:
        return None

    var_x, var_y = variables
    rango_x, rango_y = rangos
    x_min, x_max = rango_x
    y_min, y_max = rango_y

    if resolucion < 2:
        resolucion = 2

    xs = [x_min + (x_max - x_min) * i / (resolucion - 1) for i in range(resolucion)]
    ys = [y_min + (y_max - y_min) * j / (resolucion - 1) for j in range(resolucion)]

    zs = []
    for y_val in ys:
        fila = []
        for x_val in xs:
            punto = {var_x: x_val, var_y: y_val}
            try:
                z_val = evaluar_funcion_multivariable(f_expr, punto)
                if abs(z_val) > 1e10:
                    fila.append(None)
                else:
                    fila.append(round(z_val, 8))
            except Exception:
                fila.append(None)
        zs.append(fila)

    return {
        "tipo": "surface3d",
        "variables": [var_x, var_y],
        "x": xs,
        "y": ys,
        "z": zs,
    }


def ejecutar(f_expr, variables, rangos, max_iter=1000, maximizar=False):
    try:
        iteraciones = _iterar(f_expr, variables, rangos, max_iter, maximizar)
        
        punto_final = iteraciones[-1]['punto']
        valor_final = iteraciones[-1]['valor_f']
        grafica_3d = _generar_superficie_3d(f_expr, variables, rangos)
        
        return {
            'ok': True,
            'raiz': valor_final,  # mejor valor encontrado
            'punto': punto_final,  # punto óptimo multidimensional
            'iteraciones': iteraciones,
            'total_iteraciones': len(iteraciones),
            'grafica_funcion': grafica_3d,  # superficie 3D si hay 2 variables
            'grafica_error': None,    # sin evolución del error
        }
    
    except Exception as e:
        return {
            'ok': False,
            'error': str(e),
        }
