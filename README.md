# Directory Visualization

This is an experiment in matter.js to visualize files (circles) and directories (bounding boxes).

* related files will attract
* unrelated files will repel
* bounding boxes will contort to contain thier files

## Problem

Microservices came to fashion because of pain caused by the complexity monolithic style. I contend those pains were caused by poor modularity; organizing code by technology (dao, mapping, serices, etc) instead of by function (employees, payments, products).  The modular monolith can provide the simplicity of microservices, if it is organized correctly.

## Solution

Visualizing the dependency graph of a code project will help justify moving files to a business centric directory structure.  PLus it will show the particularly knotty parts of the code.

## Conclusion (3 days later)

This did not go well.  The effect I desire does not work well with a physics engine like matter.js.  Some things that went wrong are:

* fast moving objects may jump out of thier container
* additional code required to resize objects (edges of directory)
* quadrilaterals can bend to let the files escape
* must be careful with force feedback: Energy gets added to the system, making it unstable
* Constraints can not be used to simulate attractive forces 


## Usage

This includes a python program to extract dependencies from a python project.  It will output a json file that can be used by the visualization.

Example

    c:\Python311\Scripts\pydeps.exe ../django/django/ -v --noshow --deps-output dependencies.json
