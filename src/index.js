import { vec3, quat, mat4 } from 'gl-matrix';

import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkImageMarchingCubes from '@kitware/vtk.js/Filters/General/ImageMarchingCubes';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import { e } from '@kitware/vtk.js/Common/Core/Math/index';

import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkImageCroppingWidget from '@kitware/vtk.js/Widgets/Widgets3D/ImageCroppingWidget';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkPiecewiseGaussianWidget from '@kitware/vtk.js/Interaction/Widgets/PiecewiseGaussianWidget';
import vtkColorMaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkXMLImageDataReader from '@kitware/vtk.js/IO/XML/XMLImageDataReader';
import Widgets3D from '@kitware/vtk.js/Widgets/Widgets3D';


const rootContainer = document.querySelector(
  '.vtk-js-example-piecewise-gaussian-widget'
);
const containerStyle = rootContainer ? { height: '100%' } : null;
const urlToLoad = rootContainer
  ? rootContainer.dataset.url ||
    'https://kitware.github.io/vtk-js/data/volume/LIDC2.vti':
    `https://kitware.github.io/vtk-js/data/volume/LIDC2.vti`;



const controlPanel = `
<table>
  <tbody>
    <th>Iso Value</th>
    <th>
    <input  class='isoValue' type="range" min="0.0" max="1.0" step="0.05" value="0.0"/>
    </th>
    <tr>
      <td id="1">visibility</td>
      <td>
      <input  class="flag" id="7" data-name="visibility" type="checkbox" checked/> 
      </td>
    </tr>
    <tr>
      <td id="2">pickable</td>
      <td>
      <input  class="flag" id="8" data-name="pickable" type="checkbox" checked/>
      </td>
    </tr>
    <tr>
      <td id="3">contextVisibility</td>
      <td>
      <input  class="flag"  id="9" data-name="contextVisibility" type="checkbox" checked/>
      </td>
    </tr>
    <tr>
      <td id="4">handleVisibility</td>
      <td>
      <input  class="flag" id="10" data-name="handleVisibility" type="checkbox" checked/>
      </td>
    </tr>
    <tr>
      <td id="5">faceHandlesEnabled</td>
      <td>
      <input id="11" class="flag" id="11" data-name="faceHandlesEnabled" type="checkbox" checked/>
      </td>
    </tr>
      <tr>
      <td id="6">edgeHandlesEnabled</td>
      <td> 
      <input class="flag" id="12" data-name="edgeHandlesEnabled" type="checkbox" checked="checked"/>
      </td>
    </tr>
    <tr>
     <button type="button" id="BUTTON3">Show Body</button>
    </tr>
    <tr>
     <button type="button" id="BUTTON4">Show Head</button>    
    </tr>
  </tbody>
</table>`
// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------


const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
  rootContainer,
  containerStyle,
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const apiRenderWindow = fullScreenRenderer.getApiSpecificRenderWindow();
renderWindow.getInteractor().setDesiredUpdateRate(15.0);

const body = rootContainer || document.querySelector('body');



global.renderer = renderer;
global.renderWindow = renderWindow;

const actor1 = vtkActor.newInstance();
const mapper1 = vtkMapper.newInstance();
const marchingCube1 = vtkImageMarchingCubes.newInstance({
  contourValue: 0.0,
  computeNormals: true,
  mergePoints: true,
});

actor1.setMapper(mapper1);
mapper1.setInputConnection(marchingCube1.getOutputPort());

function updateIsoValue(e) {
  const isoValue = Number(e.target.value);
  marchingCube1.setContourValue(isoValue);
  renderWindow.render();
}

const reader1 = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
marchingCube1.setInputConnection(reader1.getOutputPort());

    

reader1
  .setUrl(
    'https://kitware.github.io/vtk-js/data/volume/headsq.vti',{ loadData: true })
  .then(() => {
    const data = reader1.getOutputData();
    const dataRange = data.getPointData().getScalars().getRange();
    const firstIsoValue = (dataRange[0] + dataRange[1]) / 3;

    const el = document.querySelector('.isoValue');
    
   
    
    el.setAttribute('min', dataRange[0]);
    el.setAttribute('max', dataRange[1]);
    el.setAttribute('value', firstIsoValue);
    el.addEventListener('input', updateIsoValue);
    

    marchingCube1.setContourValue(firstIsoValue);
    renderer.addActor(actor1);
    renderer.getActiveCamera().set({ position: [1, 1, 0], viewUp: [0, 0, -1] });
    renderer.resetCamera();
    renderWindow.render();
  });

// ----------------------------------------------------------------------------
// 2D overlay rendering
// ----------------------------------------------------------------------------

const overlaySize = 15;
const overlayBorder = 2;
const overlay = document.createElement('div');
overlay.style.position = 'absolute';
overlay.style.width = `${overlaySize}px`;
overlay.style.height = `${overlaySize}px`;
overlay.style.border = `solid ${overlayBorder}px red`;
overlay.style.borderRadius = '50%';
overlay.style.left = '-100px';
overlay.style.pointerEvents = 'none';
document.querySelector('body').appendChild(overlay);

const widgetContainer = document.createElement('div');
widgetContainer.style.position = 'absolute';
widgetContainer.style.top = 'calc(340px + 1em)';
widgetContainer.style.left = '5px';
widgetContainer.style.background = 'rgba(255, 255, 255, 0.3)';
// widgetContainer.style.visibility = "hidden"
body.appendChild(widgetContainer);
//actor.setVisibility(false);
//widget.set({"visibility":false});

const labelContainer = document.createElement('div');
labelContainer.style.position = 'absolute';
labelContainer.style.top = '5px';
labelContainer.style.left = '5px';
labelContainer.style.width = '100%';
labelContainer.style.color = 'white';
labelContainer.style.textAlign = 'center';
labelContainer.style.userSelect = 'none';
labelContainer.style.cursor = 'pointer';
body.appendChild(labelContainer);

let presetIndex = 1;
const globalDataRange = [0, 255];
const lookupTable = vtkColorTransferFunction.newInstance();

function changePreset(delta = 1) {
  presetIndex =
    (presetIndex + delta + vtkColorMaps.rgbPresetNames.length) %
    vtkColorMaps.rgbPresetNames.length;
  lookupTable.applyColorMap(
    vtkColorMaps.getPresetByName(vtkColorMaps.rgbPresetNames[presetIndex])
  );
  lookupTable.setMappingRange(...globalDataRange);
  lookupTable.updateRange();
  labelContainer.innerHTML = vtkColorMaps.rgbPresetNames[presetIndex];
}

let intervalID = null;
function stopInterval() {
  if (intervalID !== null) {
    clearInterval(intervalID);
    intervalID = null;
  }
}

labelContainer.addEventListener('click', (event) => {
  if (event.pageX < 200) {
    stopInterval();
    changePreset(-1);
  } else {
    stopInterval();
    changePreset(1);
  }
});


const widget1 = vtkPiecewiseGaussianWidget.newInstance({
  numberOfBins: 256,
  size: [400, 150],
});
widget1.updateStyle({
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
  histogramColor: 'rgba(100, 100, 100, 0.5)',
  strokeColor: 'rgb(0, 0, 0)',
  activeColor: 'rgb(255, 255, 255)',
  handleColor: 'rgb(50, 150, 50)',
  buttonDisableFillColor: 'rgba(255, 255, 255, 0.5)',
  buttonDisableStrokeColor: 'rgba(0, 0, 0, 0.5)',
  buttonStrokeColor: 'rgba(0, 0, 0, 1)',
  buttonFillColor: 'rgba(255, 255, 255, 1)',
  strokeWidth: 2,
  activeStrokeWidth: 3,
  buttonStrokeWidth: 1.5,
  handleWidth: 3,
  iconSize: 20, // Can be 0 if you want to remove buttons (dblClick for (+) / rightClick for (-))
  padding: 10,
});


fullScreenRenderer.setResizeCallback(({ width, height }) => {
  widget1.setSize(Math.min(450, width - 10), 150);
});

const piecewiseFunction = vtkPiecewiseFunction.newInstance();

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

const widget = vtkImageCroppingWidget.newInstance();

function widgetRegistration(e) {
  const action = e ? e.currentTarget.dataset.action : 'addWidget';
  const viewWidget = widgetManager[action](widget);
  if (viewWidget) {
    viewWidget.setDisplayCallback((coords) => {
      overlay.style.left = '-100px';
      if (coords) {
        const [w, h] = apiRenderWindow.getSize();
        overlay.style.left = `${Math.round(
          (coords[0][0] / w) * window.innerWidth -
            overlaySize * 0.5 -
            overlayBorder
        )}px`;
        overlay.style.top = `${Math.round(
          ((h - coords[0][1]) / h) * window.innerHeight -
            overlaySize * 0.5 -
            overlayBorder
        )}px`;
      }
    });

    renderer.resetCamera();
    renderer.resetCameraClippingRange();
  }
  widgetManager.enablePicking();
  renderWindow.render();
}

// Initial widget register
widgetRegistration();

// ----------------------------------------------------------------------------
// Volume rendering
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
// vtkXMLImageDataReader.newInstance({ fetchGzip: true });/// da mokhtlf fl code el tany

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(1.1);
actor.setMapper(mapper);


// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0.0, 0.0);
ofun.addPoint(255.0, 1.0);
actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
actor.getProperty().setInterpolationTypeToLinear();
actor.getProperty().setUseGradientOpacity(0, true);
actor.getProperty().setGradientOpacityMinimumValue(0, 2);
actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
actor.getProperty().setGradientOpacityMaximumValue(0, 20);
actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
actor.getProperty().setShade(true);
actor.getProperty().setAmbient(0.2);
actor.getProperty().setDiffuse(0.7);
actor.getProperty().setSpecular(0.3);
actor.getProperty().setSpecularPower(8.0);

mapper.setInputConnection(reader.getOutputPort());

// -----------------------------------------------------------
// Get data
// -----------------------------------------------------------

function getCroppingPlanes(imageData, ijkPlanes) {
  const rotation = quat.create();
  mat4.getRotation(rotation, imageData.getIndexToWorld());

  const rotateVec = (vec) => {
    const out = [0, 0, 0];
    vec3.transformQuat(out, vec, rotation);
    return out;
  };

  const [iMin, iMax, jMin, jMax, kMin, kMax] = ijkPlanes;
  const origin = imageData.indexToWorld([iMin, jMin, kMin]);
  // opposite corner from origin
  const corner = imageData.indexToWorld([iMax, jMax, kMax]);
  return [
    // X min/max
    vtkPlane.newInstance({ normal: rotateVec([1, 0, 0]), origin }),
    vtkPlane.newInstance({ normal: rotateVec([-1, 0, 0]), origin: corner }),
    // Y min/max
    vtkPlane.newInstance({ normal: rotateVec([0, 1, 0]), origin }),
    vtkPlane.newInstance({ normal: rotateVec([0, -1, 0]), origin: corner }),
    // X min/max
    vtkPlane.newInstance({ normal: rotateVec([0, 0, 1]), origin }),
    vtkPlane.newInstance({ normal: rotateVec([0, 0, -1]), origin: corner }),
  ];
}
// widget_body(true);


reader.setUrl(urlToLoad).then(() => {
  reader.loadData().then(() => {
    const image = reader.getOutputData();
    const dataArray = image.getPointData().getScalars();
    const dataRange = dataArray.getRange();
    globalDataRange[0] = dataRange[0];
    globalDataRange[1] = dataRange[1];
    
    changePreset();

    // Automatic switch to next preset every 5s
    if (!rootContainer) {
      intervalID = setInterval(changePreset, 5000);
    }

    widget1.setDataArray(dataArray.getData());
    widget1.applyOpacity(piecewiseFunction);

    widget1.setColorTransferFunction(lookupTable);
    lookupTable.onModified(() => {
      widget1.render();
      renderWindow.render();
    });
    // update crop widget
    widget.copyImageDataDescription(image);
    const cropState = widget.getWidgetState().getCroppingPlanes();
    cropState.onModified(() => {
      const planes = getCroppingPlanes(image, cropState.getPlanes());
      mapper.removeAllClippingPlanes();
      planes.forEach((plane) => {
        mapper.addClippingPlane(plane);
      });
      mapper.modified();
    });

    // add volume to renderer
    renderer.addVolume(actor);
    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    renderWindow.render();
  });
});

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);



function updateFlag(e) {
  const value = !!e.target.checked;
  const name = e.currentTarget.dataset.name;
  widget.set({ [name]: value }); 

  widgetManager.enablePicking();
  renderWindow.render();
}

const elems = document.querySelectorAll('.flag');
for (let i = 0; i < elems.length; i++) {
  elems[i].addEventListener('change', updateFlag);


  
}

const buttons = document.querySelectorAll('button');
for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', widgetRegistration);
}
actor.getProperty().setRGBTransferFunction(0, lookupTable);
actor.getProperty().setScalarOpacity(0, piecewiseFunction);
actor.getProperty().setInterpolationTypeToFastLinear();

// ----------------------------------------------------------------------------
// Default setting Piecewise function widget
// ----------------------------------------------------------------------------

widget1.addGaussian(0.425, 0.5, 0.2, 0.3, 0.2);
widget1.addGaussian(0.75, 1, 0.3, 0, 0);

widget1.setContainer(widgetContainer);
widget1.bindMouseListeners();

widget1.onAnimation((start) => {
  if (start) {
    renderWindow.getInteractor().requestAnimation(widget1);
  } else {
    renderWindow.getInteractor().cancelAnimation(widget1);
  }
});

widget1.onOpacityChange(() => {
  widget1.applyOpacity(piecewiseFunction);
  if (!renderWindow.getInteractor().isAnimating()) {
    renderWindow.render();
  }
});

// ----------------------------------------------------------------------------
// Expose variable to global namespace
// ----------------------------------------------------------------------------
global.mapper1 = mapper1;
global.marchingCube1 = marchingCube1;
global.widget1 = widget1;

actor.setVisibility(false);
widget.set({"visibility":false});
actor1.setVisibility(true); 
widgetContainer.style.visibility = "visible"; 
actor1.setScale(2,2,2); 

const element = document.getElementById("BUTTON3");
element.addEventListener("click",function show () {show_body(true);
  });

const element2 = document.getElementById("BUTTON4");
element2.addEventListener("click",function hide () {show_body(false);
  });

widget.set({"visibility": false });
widgetContainer.style.visibility = "hidden";

document.getElementById("1").style.display = "none" ;
document.getElementById("2").style.display = "none";
document.getElementById("3").style.display = "none";
document.getElementById("4").style.display = "none";
document.getElementById("5").style.display = "none";
document.getElementById("6").style.display = "none";
document.getElementById("7").style.display = "none";
document.getElementById("8").style.display = "none";
document.getElementById("9").style.display = "none";
document.getElementById("10").style.display = "none";
document.getElementById("11").style.display = "none";
document.getElementById("12").style.display = "none";


function show_body(bool){
if (bool == true){
  actor1.setVisibility(false); 
  w3.hide('th');
  actor.setVisibility(true);
  widget.set({"visibility": true });
  widgetContainer.style.visibility = "visible";
  document.getElementById("1").style.display = "block";
  document.getElementById("2").style.display = "block";
  document.getElementById("3").style.display = "block";
  document.getElementById("4").style.display = "block";
  document.getElementById("5").style.display = "block";
  document.getElementById("6").style.display = "block";
  document.getElementById("7").style.display = "block";
  document.getElementById("8").style.display = "block";
  document.getElementById("9").style.display = "block";
  document.getElementById("10").style.display = "block";
  document.getElementById("11").style.display = "block";
  document.getElementById("12").style.display = "block";
  w3.show('td');
}else{
  actor.setVisibility(false); 
  w3.hide('td');
  actor1.setVisibility(true);
  widget.set({"visibility": false });
  widgetContainer.style.visibility = "hidden";
  w3.show('th');
}
  }