from docbuilder import DocBuilder
import glob

for m in glob.glob("src/*"):
    print("    " + m)
    DocBuilder()\
        .parse(m)\
        .html("docs/api/%s.html" % m.replace('src/', '').replace('.js', ''),
              style="img#logo{position:fixed;top:20px;right:20px;width:100px;}pre code{width: 100%;}")

