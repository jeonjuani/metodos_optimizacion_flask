import math
import re
import numpy as np


def _preprocesar(expr):
    expr = re.sub(r'\s+', '', expr)
    expr = expr.replace(',', '.')
    expr = expr.replace('^', '**')
    # reemplazar funciones por math.funciones
    funciones = {
        'sin': 'math.sin',
        'cos': 'math.cos',
        'tan': 'math.tan',
        'asin': 'math.asin',
        'acos': 'math.acos',
        'atan': 'math.atan',
        'exp': 'math.exp',
        'log': 'math.log',
        'log10': 'math.log10',
        'sqrt': 'math.sqrt',
    }
    for func, repl in funciones.items():
        expr = expr.replace(func + '(', repl + '(')
    # numero seguido de letra o parentesis abierto
    expr = re.sub(r'(\d)([a-zA-Z(])', r'\1*\2', expr)
    # cierre de parentesis seguido de parentesis abierto
    expr = re.sub(r'(\))(\()', r'\1*\2', expr)
    return expr


def evaluar_funcion(expr, x):
    try:
        expr_proc = _preprocesar(expr)
        resultado = eval(expr_proc, {
            "__builtins__": {},
            "x": x,
            "math": math,
            "sin": math.sin, "cos": math.cos, "tan": math.tan,
            "asin": math.asin, "acos": math.acos, "atan": math.atan,
            "exp": math.exp, "log": math.log, "log10": math.log10,
            "sqrt": math.sqrt, "abs": abs,
            "pi": math.pi, "e": math.e,
        })
        return float(resultado)
    except Exception as exc:
        raise ValueError(f"Error evaluando la funcion: {exc}")


def generar_puntos_grafica(f_expr, x_min, x_max, n=400):
    margen = abs(x_max - x_min) * 0.5
    x_vals = np.linspace(x_min - margen, x_max + margen, n).tolist()
    y_vals = []
    for x in x_vals:
        try:
            y = evaluar_funcion(f_expr, x)
            y_vals.append(round(y, 8) if abs(y) <= 1e10 else None)
        except Exception:
            y_vals.append(None)
    return x_vals, y_vals


def evaluar_funcion_multivariable(expr, variables_dict):
    try:
        expr_proc = _preprocesar(expr)
        # Crear namespace con todas las variables
        namespace = {
            "__builtins__": {},
            "math": math,
            "sin": math.sin, "cos": math.cos, "tan": math.tan,
            "asin": math.asin, "acos": math.acos, "atan": math.atan,
            "exp": math.exp, "log": math.log, "log10": math.log10,
            "sqrt": math.sqrt, "abs": abs,
            "pi": math.pi, "e": math.e,
        }
        # Agregar todas las variables al namespace
        namespace.update(variables_dict)

        # Expandir productos implícitos entre variables de 1 letra.
        # Ej: "2xy - yx" -> "2*x*y - y*x"
        variables_simples = [v for v in variables_dict.keys() if re.fullmatch(r'[a-zA-Z]', v)]
        if variables_simples:
            tokens_ident = re.compile(r'\b[a-zA-Z_]\w*\b')

            def _expandir_identificador(match):
                token = match.group(0)
                if token in namespace:
                    return token
                if len(token) > 1 and all(ch in variables_simples for ch in token):
                    return '*'.join(token)
                return token

            expr_proc = tokens_ident.sub(_expandir_identificador, expr_proc)
        
        resultado = eval(expr_proc, namespace)
        return float(resultado)
    except Exception as exc:
        raise ValueError(f"Error evaluando la funcion multivariable: {exc}")
