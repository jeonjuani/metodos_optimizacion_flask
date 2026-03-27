import os
from flask import Flask, render_template, request, jsonify


from metodos import biseccion
from metodos import regla_falsa
from metodos import newton_raphson
from metodos import newton_optimo
from metodos import razon_dorada
from metodos import interpolacion_cuadratica
from metodos import busqueda_aleatoria


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, 'templates'),
    static_folder=os.path.join(BASE_DIR, 'static'),
)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calcular/biseccion', methods=['POST'])
def calcular_biseccion():
    data = request.get_json()
    try:
        resultado = biseccion.ejecutar(
            f_expr   = data['funcion'],
            xl       = float(data['xl']),
            xu       = float(data['xu']),
            tol      = float(data.get('tolerancia', 1e-6)),
            max_iter = int(data.get('max_iter', 100)),
        )
        return jsonify(resultado)
    except (ValueError, KeyError) as e:
        return jsonify({"ok": False, "error": str(e)})
    except Exception as e:
        return jsonify({"ok": False, "error": f"Error inesperado: {e}"})


@app.route('/calcular/regla_falsa', methods=['POST'])
def calcular_regla_falsa():
    data = request.get_json()
    try:
        resultado = regla_falsa.ejecutar(
            f_expr   = data['funcion'],
            xl       = float(data['xl']),
            xu       = float(data['xu']),
            tol      = float(data.get('tolerancia', 1e-6)),
            max_iter = int(data.get('max_iter', 100)),
        )
        return jsonify(resultado)
    except (ValueError, KeyError) as e:
        return jsonify({"ok": False, "error": str(e)})
    except Exception as e:
        return jsonify({"ok": False, "error": f"Error inesperado: {e}"})


@app.route('/calcular/razon_dorada', methods=['POST'])
def calcular_razon_dorada():
    data = request.get_json()
    try:
        resultado = razon_dorada.ejecutar(
            f_expr    = data['funcion'],
            xl        = float(data['xl']),
            xu        = float(data['xu']),
            tol       = float(data.get('tolerancia', 1e-6)),
            max_iter  = int(data.get('max_iter', 100)),
            maximizar = data.get('objetivo', 'min') == 'max',
        )
        return jsonify(resultado)
    except (ValueError, KeyError) as e:
        return jsonify({"ok": False, "error": str(e)})
    except Exception as e:
        return jsonify({"ok": False, "error": f"Error inesperado: {e}"})


@app.route('/calcular/interpolacion_cuadratica', methods=['POST'])
def calcular_interpolacion_cuadratica():
    data = request.get_json()
    try:
        resultado = interpolacion_cuadratica.ejecutar(
            f_expr    = data['funcion'],
            x0        = float(data['x0']),
            x1        = float(data['x1']),
            x2        = float(data['x2']),
            tol       = float(data.get('tolerancia', 1e-6)),
            max_iter  = int(data.get('max_iter', 100)),
            maximizar = data.get('objetivo', 'min') == 'max',
        )
        return jsonify(resultado)
    except (ValueError, KeyError) as e:
        return jsonify({"ok": False, "error": str(e)})
    except Exception as e:
        return jsonify({"ok": False, "error": f"Error inesperado: {e}"})


@app.route('/calcular/newton_raphson', methods=['POST'])
def calcular_newton_raphson():
    data = request.get_json()
    try:
        resultado = newton_raphson.ejecutar(
            f_expr = data['funcion'],
            x0     = float(data.get('x0', 1.0)),
            tol    = float(data.get('tolerancia', 1e-6)),
            max_iter = int(data.get('max_iter', 100)),
        )
        return jsonify(resultado)
    except (ValueError, KeyError) as e:
        return jsonify({"ok": False, "error": str(e)})
    except Exception as e:
        return jsonify({"ok": False, "error": f"Error inesperado: {e}"})


@app.route('/calcular/newton_optimo', methods=['POST'])
def calcular_newton_optimo():
    data = request.get_json()
    try:
        resultado = newton_optimo.ejecutar(
            f_expr = data['funcion'],
            x0     = float(data.get('x0', 1.0)),
            tol    = float(data.get('tolerancia', 1e-6)),
            max_iter = int(data.get('max_iter', 100)),
        )
        return jsonify(resultado)
    except (ValueError, KeyError) as e:
        return jsonify({"ok": False, "error": str(e)})
    except Exception as e:
        return jsonify({"ok": False, "error": f"Error inesperado: {e}"})


@app.route('/calcular/busqueda_aleatoria', methods=['POST'])
def calcular_busqueda_aleatoria():
    data = request.get_json()
    try:
        resultado = busqueda_aleatoria.ejecutar(
            f_expr    = data['funcion'],
            variables = data['variables'],
            rangos    = data['rangos'],
            max_iter  = int(data.get('max_iter', 1000)),
            maximizar = data.get('objetivo', 'min') == 'max',
        )
        return jsonify(resultado)
    except (ValueError, KeyError) as e:
        return jsonify({"ok": False, "error": str(e)})
    except Exception as e:
        return jsonify({"ok": False, "error": f"Error inesperado: {e}"})


# ── Cuando agregues más métodos, el patrón es idéntico: ──────────────────────
#
# @app.route('/calcular/regla_falsa', methods=['POST'])
# def calcular_regla_falsa():
#     data = request.get_json()
#     try:
#         return jsonify(regla_falsa.ejecutar(
#             f_expr=data['funcion'], xl=float(data['xl']), ...
#         ))
#     except ...


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
