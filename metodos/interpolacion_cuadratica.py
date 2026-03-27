from metodos.utils import evaluar_funcion, generar_puntos_grafica


def ejecutar(f_expr, x0, x1, x2, tol=1e-6, max_iter=100, maximizar=False):
    if not (x0 < x1 < x2):
        raise ValueError('Requiere x0 < x1 < x2.')

    iteraciones = []

    for i in range(1, max_iter + 1):
        f0 = evaluar_funcion(f_expr, x0)
        f1 = evaluar_funcion(f_expr, x1)
        f2 = evaluar_funcion(f_expr, x2)

        denom = (2 * (f0 * (x1 - x2) + f1 * (x2 - x0) + f2 * (x0 - x1)))
        if abs(denom) < 1e-14:
            raise ValueError('Denominador demasiado pequeño en iteración, no se puede continuar.')

        x3 = (f0 * (x1**2 - x2**2) + f1 * (x2**2 - x0**2) + f2 * (x0**2 - x1**2)) / denom
        f3 = evaluar_funcion(f_expr, x3)

        iteraciones.append({
            'iteracion': i,
            'x0': round(x0, 8),
            'x1': round(x1, 8),
            'x2': round(x2, 8),
            'x3': round(x3, 8),
            'f_x0': round(f0, 8),
            'f_x1': round(f1, 8),
            'f_x2': round(f2, 8),
            'f_x3': round(f3, 8),
            'error': round(abs(x2 - x0), 8)
        })

        if abs(x2 - x0) < tol:
            break

        mejor = (f3 > f1) if maximizar else (f3 < f1)
        if mejor:
            if x3 > x1:
                x0 = x1
                x1 = x3
            else:
                x2 = x1
                x1 = x3
        else:
            if x3 > x1:
                x2 = x3
            else:
                x0 = x3

        # Mantener orden
        orden = sorted([x0, x1, x2])
        x0, x1, x2 = orden

        if abs(x2 - x0) < tol:
            break

    punto_optimo = x1
    a = x0 - 1
    b = x2 + 1
    x_vals, y_vals = generar_puntos_grafica(f_expr, a, b)

    iter_nums = [it['iteracion'] for it in iteraciones if it['error'] is not None]
    errores = [it['error'] for it in iteraciones if it['error'] is not None]

    return {
        'ok': True,
        'iteraciones': iteraciones,
        'raiz': punto_optimo,
        'total_iteraciones': len(iteraciones),
        'grafica_funcion': {'x': x_vals, 'y': y_vals},
        'grafica_error': {'iteraciones': iter_nums, 'errores': errores},
    }
