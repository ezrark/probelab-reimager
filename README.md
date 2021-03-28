# Probelab-ReImager
This is the backend module and command line version for Probelab-ReImager. Most options are available via cli but more
control is offered through the module interface.

Iconv-lite no longer needed, pre-compressed version only supporting win1251 for JEOL files included. This reduces
dependency size by ~400kb minified.

Full PFE MDB support has been added for Windows, MacOS, and Linux. Windows uses the provided driver and MacOS/Linux uses
[mdb-sql](https://github.com/mdbtools/mdbtools)

### Code Acknowledgments
Thanks to [Evan Miller](https://github.com/evanmiller) for his upkeep of MDB tools, quick fixes and responses.

```
Usage: thermo-reimager [options] [directory]

Options:
-v, --version                                   Displays the version information
-h, --help                                      Provides this text
-t, --ontop                                     Sets the scale bar on top of the scale value
-i, --points                                    Prints points onto image
-p, --position [pos]                            Position to print the scale
-c, --color [color]                             Scale color
-b, --background [color]                        'Below' or if 'opaque', background color
-o, --opacity [0-100]                           Opacity of the background for the scale (default 0)
-s, --scale [µm]                                Scale to display, < 1 for auto
-k, --barheight [0-100]                         Set scale bar to a % of the text font height, < 1 for auto(8)
-x, --pixelsize [num]                           Sets the pixel size constant for the probe calibration equation
-n, --pointtype [pointType]                     Sets the type used to define points (Only over 128 res)
-e, --textcolor [textColor]                     Sets the color to display the point names in
-z, --textsize [num]                            Sets the font size for the point names
-d, --pointsize [num]                           Sets the point size
-f, --font [font]                               Sets the font to use
-a, --acq                                       Exports an ACQ file alongside the image (Forced jpg output)
-l, --layer [layerName, [color, opacity]]       Tries to overlay the layer, when > 1, added in order

Pixel Size Constant:
        Default: 116.73
Default was with the UMN Probelab's JEOL JAX 8530F Plus and is the constant of the calibration curve.
The calibration curve seems to always be CONST*x^(-1) or close enough to it for scale estimations.

Colors (Scale and Background):
a, auto         Selects the color automatically
b, black
w, white

Colors (Text):
a, auto         Selects the color automatically
b, black
w, white
r, red
o, orange

Colors (Layers)
a, auto         Selects the color automatically
r, red
o, orange
g, green

Fonts:
o, opensans     Good, free sans font
c, comicsans    Why

Positions:
d,  default             Scale is Underneath the image, Centered
bl, belowleft           Scale is Under the image, Left
br, belowright          Scale is Under the image, Right
bc, belowcenter         Scale is Under the image, Centered
ul, upperleft           Scale is in the Upper Left
ur, upperright          Scale is in the Upper Right
ll, lowerleft           Scale is in the Lower Left
lr, loweright           Scale is in the Lower Right
lc, lowercenter         Scale is in the Lower Center
j,  jeol                Scale is placed overtop JEOL bar
n,  none                No scale shown

Point Types:
t, thermo       Thermo's point icon
r, round        Thermo's point icon but round
., circle       A filled in circle
+, cross        A cross
```