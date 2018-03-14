from docbuilder import DocBuilder

# Modules
modules = [
    "data",
    "rest",
    "signals",
    "system.log",
    "system.version",
    "user",
    "widget",
    "widgets.areachart",
    "widgets.barchart",
    "widgets.chordchart",
    "widgets.grid",
    "widgets.hint",
    "widgets.histogram",
    "widgets.info",
    "widgets.label",
    "widgets.legend",
    "widgets.linechart",
    "widgets.map",
    "widgets.picture",
    "widgets.piechart",
    "widgets.slider",
    "widgets.status",
    "widgets.trackpad",
]
for m in modules:
    print("    " + m)
    DocBuilder()\
        .parse("src/%s.js" % m)\
        .html("docs/api/%s.html" % m,
              style="img#logo{position:fixed;top:20px;right:20px;width:100px;}pre code{width: 100%;}")

