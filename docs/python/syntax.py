# title          : syntax.py
# description    : File containing syntax elements
# author         : Enys Mones
# date           : 2017.06.28
# version        : 0.1
# ==================================================


class _JS:
    def __init__(self):
        pass

    TAGS = {
        'block': {
            'START': "/**",
            'END': "*/",
        },
        'flag': {
            'ignore': "@ignore",
            'private': "@private",
            'constructor': "@constructor",
            'deprecated': "@deprecated",
        },
        'label': {
            'module': "@module",
            'namespace': "@namespace",
            'class': "@class",
            'method': "@method",
            'memberOf': "@memberOf",
            'methodOf': "@methodOf",
            'requires': "@requires",
            'override': "@override",
            'type': "@type",
        },
        'description': {
            'description': "@description",
            'copyright': "@copyright",
            'author': "@author",
        },
        'value': {
            'var': "@var",
        },
        'unnamed_value_desc': {
            'returns': "@returns",
        },
        'named_value_desc': {
            'param': "@param",
            'property': "@property",
        }
    }

    IDS = ['module', 'namespace', 'class', 'method', 'var', 'property']
js = _JS()
