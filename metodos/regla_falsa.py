from metodos.utils import evaluar_funcion, generar_puntos_grafica


def _iterar(f_expr, xl, xu, tol, max_iter):
    iteraciones = []
    xr_anterior = None

    # Verificar cambio de signo inicial
    if evaluar_funcion(f_expr, xl) * evaluar_funcion(f_expr, xu) > 0:
        raise ValueError(
            "La función no cambia de signo en el intervalo dado. "
            "Verifica los valores de x_l y x_u."
        )

    for i in range(1, max_iter + 1):
        f_xl_val = evaluar_funcion(f_expr, xl)
        f_xu_val = evaluar_funcion(f_expr, xu)

        denominador = f_xl_val - f_xu_val
        if denominador == 0:
            raise ValueError(
                "f(x_l) - f(x_u) = 0 en la iteración "
                f"{i}. El método no puede continuar."
            )

        # Fórmula de la falsa posición
        xr = xu - f_xu_val * (xl - xu) / denominador
        f_xr_val = evaluar_funcion(f_expr, xr)

        # Error relativo porcentual
        if xr_anterior is not None and xr != 0:
            error = abs((xr - xr_anterior) / xr) * 100
        else:
            error = None

        iteraciones.append({
            "iteracion": i,
            "xl":   round(xl, 8),
            "xu":   round(xu, 8),
            "xr":   round(xr, 8),
            "f_xl": round(f_xl_val, 8),
            "f_xr": round(f_xr_val, 8),
            "error": round(error, 6) if error is not None else "---",
        })

        # Criterios de parada
        if f_xr_val == 0:
            break
        if error is not None and error < tol:
            break

        # Actualizar intervalo según cambio de signo
        if f_xl_val * f_xr_val < 0:
            xu = xr
        else:
            xl = xr

        xr_anterior = xr

    return iteraciones


def ejecutar(f_expr, xl, xu, tol=1e-6, max_iter=100):
    iteraciones = _iterar(f_expr, xl, xu, tol, max_iter)
    raiz = iteraciones[-1]["xr"]

    x_vals, y_vals = generar_puntos_grafica(f_expr, xl, xu)

    iter_nums = [it["iteracion"] for it in iteraciones if it["error"] != "---"]
    errores   = [it["error"]     for it in iteraciones if it["error"] != "---"]

    return {
        "ok": True,
        "iteraciones": iteraciones,
        "raiz": raiz,
        "total_iteraciones": len(iteraciones),
        "grafica_funcion": {"x": x_vals, "y": y_vals},
        "grafica_error":   {"iteraciones": iter_nums, "errores": errores},
    }
