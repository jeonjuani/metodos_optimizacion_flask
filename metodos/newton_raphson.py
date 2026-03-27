from metodos.utils import evaluar_funcion, generar_puntos_grafica


def derivada(f_expr, x, h=1e-6):
    return (evaluar_funcion(f_expr, x + h) - evaluar_funcion(f_expr, x - h)) / (2 * h)


def _iterar(f_expr, x0, tol, max_iter):
    iteraciones = []
    x = x0

    for i in range(1, max_iter + 1):
        fx = evaluar_funcion(f_expr, x)
        fpx = derivada(f_expr, x)

        if abs(fpx) < 1e-12:
            raise ValueError(f"La derivada es cero o muy cercana a cero en x = {x:.12f}. Imposible continuar.")

        x_new = x - fx / fpx

        error = None
        if x_new != 0:
            error = abs((x_new - x) / x_new) * 100

        iteraciones.append({
            "iteracion": i,
            "x": round(x, 8),
            "f_x": round(fx, 8),
            "f_x'": round(fpx, 8),
            "x_next": round(x_new, 8),
            "error": round(error, 6) if error is not None else "---"
        })

        if abs(fx) < tol or (error is not None and error < tol):
            x = x_new
            break

        x = x_new

    return iteraciones


def ejecutar(f_expr, x0, tol=1e-6, max_iter=100):
    iteraciones = _iterar(f_expr, x0, tol, max_iter)
    raiz = iteraciones[-1]["x_next"] if iteraciones else x0

    # Graficar alrededor del punto inicial y la raíz final
    a = min(x0, raiz) - 1
    b = max(x0, raiz) + 1
    x_vals, y_vals = generar_puntos_grafica(f_expr, a, b)

    iter_nums = [it["iteracion"] for it in iteraciones if it["error"] != "---"]
    errores = [it["error"] for it in iteraciones if it["error"] != "---"]

    return {
        "ok": True,
        "iteraciones": iteraciones,
        "raiz": raiz,
        "total_iteraciones": len(iteraciones),
        "grafica_funcion": {"x": x_vals, "y": y_vals},
        "grafica_error": {"iteraciones": iter_nums, "errores": errores},
    }
