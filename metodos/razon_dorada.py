from metodos.utils import evaluar_funcion, generar_puntos_grafica


def ejecutar(f_expr, xl, xu, tol=1e-6, max_iter=100, maximizar=False):
    if xl >= xu:
        raise ValueError('x_l debe ser menor que x_u.')

    phi = 0.6180339887498949

    x1 = xu - phi * (xu - xl)
    x2 = xl + phi * (xu - xl)

    f1 = evaluar_funcion(f_expr, x1)
    f2 = evaluar_funcion(f_expr, x2)

    iteraciones = []

    for i in range(1, max_iter + 1):
        error = abs(xu - xl)

        iteraciones.append({
            'iteracion': i,
            'xl': round(xl, 8),
            'xu': round(xu, 8),
            'x1': round(x1, 8),
            'x2': round(x2, 8),
            'f_x1': round(f1, 8),
            'f_x2': round(f2, 8),
            'error': round(error, 8)
        })

        if error < tol:
            break

        if maximizar:
            if f2 > f1:
                xl = x1
                x1 = x2
                f1 = f2
                x2 = xl + phi * (xu - xl)
                f2 = evaluar_funcion(f_expr, x2)
            else:
                xu = x2
                x2 = x1
                f2 = f1
                x1 = xu - phi * (xu - xl)
                f1 = evaluar_funcion(f_expr, x1)
        else:
            if f1 > f2:
                xl = x1
                x1 = x2
                f1 = f2
                x2 = xl + phi * (xu - xl)
                f2 = evaluar_funcion(f_expr, x2)
            else:
                xu = x2
                x2 = x1
                f2 = f1
                x1 = xu - phi * (xu - xl)
                f1 = evaluar_funcion(f_expr, x1)

    punto_optimo = (xl + xu) / 2
    a = min(xl, xu) - 1
    b = max(xl, xu) + 1
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
