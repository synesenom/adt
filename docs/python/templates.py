# -*- coding: utf-8 -*-
# title          : templates.py
# description    : Contains templates for different export types.
# author         : Enys Mones
# date           : 2017.08.17
# version        : 0.1
# ==================================================================

CSS = ""

HTML = u"<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><link href='https://fonts.googleapis.com/css?family=Montserrat:200,300,700' rel='stylesheet'><link rel='stylesheet' type='text/css' href='https://cdn.rawgit.com/synesenom/whiteprint/master/wp.min.css'><style>{}</style><title>{}</title></head><body><input type='checkbox' id='menu'><label for='menu' id='open'>☰</label><aside><div class='logo'>{}</div><nav><div>{}</div></nav></aside><main>{}<label for='menu' id='exit'></label></main></body></html>"

def html(name, menu, content, style=""):
    return HTML.encode('utf-8').format(CSS+style, name, name, menu, content)