#!/bin/bash

SRC_DIR="src"
DST_DIR="build"
DL_DIR="docs/dl"

echo ""
echo "Building dashboard-utils"
echo "------------------------"

# Build docs
echo "  building documentation"
python docs/python/parser.py

# Build modules
echo "  compiling modules:"
module_list=""
for module in $(ls src); do
    echo "    $module"
    module_list=${module_list}" "${SRC_DIR}/${module}
    uglifyjs \
        ${SRC_DIR}/${module} \
        --mangle \
        --output ${DST_DIR}/${module/.js/.min.js}
    cp ${DST_DIR}/${module/.js/.min.js} ${DL_DIR}/
done

# Build full library
uglifyjs ${module_list} --mangle --output dashboard-utils.min.js
