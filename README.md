# CG-VTKjs
A Web GUI application

A volume rendering web app with VTK.js & HTML
● We used datasets provided in vtk examples (head for surface rendering and chest for ray casting)
● Features:
○ Support loading DICOM series dynamically using load button
○ Surface rendering with adjustable iso value (try sliders)
○ Ray casting rendering (with a fixed transfer function) :  ■ Adjustable transfer function.  ■ Shift preset.
○ An interactive widget to cut the volume in the three perpendicular planes vtkImageCroppingWidget

● vtkDICOMImageReader object is used.

# Head 


https://user-images.githubusercontent.com/61358818/154952270-58007bd9-9037-4249-955d-d24a65d24788.mp4



# Body


https://user-images.githubusercontent.com/61358818/154952732-31e6ee54-e133-4300-920a-36c524e99498.mp4


