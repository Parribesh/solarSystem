'use strict'

var gl;

var appInput = new Input();
var time = new Time();
var camera = new OrbitCamera(appInput);

var earthGeometry = null; // this will be created after loading from a file
var sunGeometry = null;
var mercuryGeometry = null;
var venusGeometry = null;
var skyGeo1 = null;
var skyGeo2 = null;
var skyGeo3 = null;
var skyGeo4 = null;
var skyGeo5 = null;
var marsGeometry = null;
var jupitarGeometry = null;
var saturnGeometry = null;
var uranusGeometry = null;
var neptuneGeometry = null;
var moonGeometry = null;
var atmGeometry = null;
//var groundGeometry = null;

var projectionMatrix = new Matrix4();
var planetPosition = new Vector3();
var mercuryPosition = new Vector3();
var venusPosition = new Vector3();
var marsPosition = new Vector3();
var jupitarPosition = new Vector3();
var saturnPosition = new Vector3();
var uranusPosition = new Vector3();
var neptunePosition = new Vector3();
var moonPosition = new Vector3();

// the shader that will be used by each piece of geometry (they could each use their own shader but in this case it will be the same)
var phongShaderProgram;
var basicColorProgram;


// auto start the app when the html page is ready
window.onload = window['initializeAndStartRendering'];

// we need to asynchronously fetch files from the "server" (your local hard drive)
var loadedAssets = {
    phongTextVS: null, phongTextFS: null,
    vertexColorVS: null, vertexColorFS: null,
    earthJSON: null,
    venusJSON: null,
    marsJSON: null,
    jupitarJSON: null,
    saturnJSON: null,
    uranusJSON: null,
    neuptuneJSON: null,
    mercuryJSON: null,
    moonJSON: null,
    sunJSON: null,
    earthImage: null,
    sunImage: null,
    mercuryImage: null,
    venusImage: null,
    marsImage: null,
    jupitarImage: null,
    saturnImage: null,
    uranusImage: null,
    neptuenImage: null,
    moonImage: null,
};

// -------------------------------------------------------------------------
function initializeAndStartRendering() {
    initGL();
    loadAssets(function() {
        createShaders(loadedAssets);
        createScene();

        updateAndRender();
    });
}

// -------------------------------------------------------------------------
function initGL(canvas) {
    var canvas = document.getElementById("webgl-canvas");

    try {
        gl = canvas.getContext("webgl");
        gl.canvasWidth = canvas.width;
        gl.canvasHeight = canvas.height;
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

    } catch (e) {}

    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

// -------------------------------------------------------------------------
function loadAssets(onLoadedCB) {
    var filePromises = [
        fetch('./shaders/phong.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/phong.pointlit.fs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/flat.color.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/flat.color.fs.glsl').then((response) => { return response.text(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        loadImage('./data/earth.jpg'),
        loadImage('./data/sun.jpg'),
        loadImage('./data/sky.jpg'),
        loadImage('./data/mercury.jpg'),
        loadImage('./data/venus.jpg'),
        loadImage('./data/mars.jpg'),
        loadImage('./data/jupitar.jpg'),
        loadImage('./data/saturn.jpg'),
        loadImage('./data/uranus.jpg'),
        loadImage('./data/neptune.jpg'),
        loadImage('./data/moon.jpg'),
        loadImage('./data/atmImage.jpg')

    ];

    Promise.all(filePromises).then(function(values) {
        // Assign loaded data to our named variables
        loadedAssets.phongTextVS = values[0];
        loadedAssets.phongTextFS = values[1];
        loadedAssets.vertexColorVS = values[2];
        loadedAssets.vertexColorFS = values[3];
        loadedAssets.sunJSON = values[4];
        loadedAssets.earthJSON = values[5];
        loadedAssets.mercuryJSON = values[6];
        loadedAssets.venusJSON = values[7];
        loadedAssets.marsJSON = values[8];
        loadedAssets.jupitarJSON = values[9];
        loadedAssets.saturnJSON = values[10];
        loadedAssets.uranusJSON = values[11];
        loadedAssets.neptuneJSON = values[12];
        loadedAssets.moonJSON = values[13];
        loadedAssets.earthImage = values[14];
        loadedAssets.sunImage = values[15];
        loadedAssets.skyImage = values[16];
        loadedAssets.mercuryImage = values[17];
        loadedAssets.venusImage = values[18];
        loadedAssets.marsImage = values[19];
        loadedAssets.jupitarImage = values[20];
        loadedAssets.saturnImage = values[21];
        loadedAssets.uranusImage = values[22];
        loadedAssets.neptuneImage = values[23];
        loadedAssets.moonImage = values[24];
        loadedAssets.atmImage=values[25];
    }).catch(function(error) {
        console.error(error.message);
    }).finally(function() {
        onLoadedCB();
    });
}

// -------------------------------------------------------------------------
function createShaders(loadedAssets) {
    phongShaderProgram = createCompiledAndLinkedShaderProgram(loadedAssets.phongTextVS, loadedAssets.phongTextFS);

    phongShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(phongShaderProgram, "aVertexPosition"),
        vertexNormalsAttribute: gl.getAttribLocation(phongShaderProgram, "aNormal"),
        vertexTexcoordsAttribute: gl.getAttribLocation(phongShaderProgram, "aTexcoords")
    };

    phongShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uProjectionMatrix"),
        planetPositionUniform: gl.getUniformLocation(phongShaderProgram, "uPlanetPosition"),
        cameraPositionUniform: gl.getUniformLocation(phongShaderProgram, "uCameraPosition"),
        textureUniform: gl.getUniformLocation(phongShaderProgram, "uTexture"),
        alphaUniform: gl.getUniformLocation(phongShaderProgram, "uAlpha"),
    };


  //  basicColorProgram = createCompiledAndLinkedShaderProgram(loadedAssets.vertexColorVS, loadedAssets.vertexColorFS);
  //   gl.useProgram(basicColorProgram);

  //   basicColorProgram.attributes = {
  //       vertexPositionAttribute: gl.getAttribLocation(basicColorProgram, "aVertexPosition"),
  //   };

  //   basicColorProgram.uniforms = {
  //       worldMatrixUniform: gl.getUniformLocation(basicColorProgram, "uWorldMatrix"),
  //       viewMatrixUniform: gl.getUniformLocation(basicColorProgram, "uViewMatrix"),
  //       projectionMatrixUniform: gl.getUniformLocation(basicColorProgram, "uProjectionMatrix"),
  //       colorUniform: gl.getUniformLocation(basicColorProgram, "uColor"),
  //       textureUniform: gl.getUniformLocation(phongShaderProgram, "uTexture"),
  //   };
   }

// -------------------------------------------------------------------------
function createScene() {
    // groundGeometry = new WebGLGeometryQuad(gl, phongShaderProgram);
    // groundGeometry.create(loadedAssets.crackedMudImage);

    //var scale = new Matrix4().scale(10.0, 10.0, 10.0);

    // compensate for the model being flipped on its side
    // var rotation = new Matrix4().setRotationX(-90);

    // groundGeometry.worldMatrix.multiplyRightSide(rotation);
    // groundGeometry.worldMatrix.multiplyRightSide(scale);

    //let's draw the skies
    skyGeo1 = new WebGLGeometryQuad(gl, phongShaderProgram);
    skyGeo1.create(loadedAssets.skyImage);
    skyGeo2 = new WebGLGeometryQuad(gl, phongShaderProgram);
    skyGeo2.create(loadedAssets.skyImage);
    skyGeo3 = new WebGLGeometryQuad(gl, phongShaderProgram);
    skyGeo3.create(loadedAssets.skyImage);
    skyGeo4 = new WebGLGeometryQuad(gl, phongShaderProgram);
    skyGeo4.create(loadedAssets.skyImage);
    skyGeo5 = new WebGLGeometryQuad(gl, phongShaderProgram);
    skyGeo5.create(loadedAssets.skyImage);

    var scale1 = new Matrix4().scale(80.0, 80.0, 80.0);

    // compensate for the model being flipped on its side
    var rotation1 = new Matrix4().setRotationX(-90);
    var rotation4 = new Matrix4().setRotationX(+90);
    var rotation3 = new Matrix4().setRotationY(-90);
    var rotation2 = new Matrix4().setRotationY(+90);

    skyGeo1.worldMatrix.multiplyRightSide(rotation1);
    skyGeo1.worldMatrix.multiplyRightSide(scale1);
    //skyGeo2.worldMatrix.multiplyRightSide(rotation1);
    skyGeo2.worldMatrix.multiplyRightSide(scale1);
    skyGeo3.worldMatrix.multiplyRightSide(rotation4);
    skyGeo3.worldMatrix.multiplyRightSide(scale1);
    skyGeo4.worldMatrix.multiplyRightSide(rotation3);
    skyGeo4.worldMatrix.multiplyRightSide(scale1);
    skyGeo5.worldMatrix.multiplyRightSide(rotation2);
    skyGeo5.worldMatrix.multiplyRightSide(scale1);

    skyGeo1.worldMatrix.translate(0.0, -80.0, 0.0);
    skyGeo2.worldMatrix.translate(0.0, 0.0, -80.0);
    skyGeo3.worldMatrix.translate(0.0, 80.0, 0.0);
    skyGeo4.worldMatrix.translate(40.0, 0.0, 0.0);
    skyGeo5.worldMatrix.translate(-40.0, 0.0, 0.0);

    // let's make the sun first 
    sunGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    sunGeometry.create(loadedAssets.sunJSON, loadedAssets.sunImage);
    //sun diameter of 7
    var sunScaleMatrix = new Matrix4().scale(0.07, 0.07, 0.07);
    sunGeometry.worldMatrix.setIdentity().multiplyRightSide(sunScaleMatrix);
    //sunGeometry.worldMatrix.translate(0.0, 5.0, 0.0);

    mercuryGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    mercuryGeometry.create(loadedAssets.mercuryJSON, loadedAssets.mercuryImage);
    // Scaled it down so that the diameter is 3
    var mercuryScale = new Matrix4().scale(0.02, 0.02, 0.02);
    mercuryGeometry.worldMatrix.setIdentity();
    mercuryGeometry.worldMatrix.multiplyRightSide(mercuryScale);

    venusGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    venusGeometry.create(loadedAssets.venusJSON, loadedAssets.venusImage);
    // Scaled it down so that the diameter is 3
    var venusScale = new Matrix4().scale(0.025, 0.025, 0.025);
    venusGeometry.worldMatrix.setIdentity();
    venusGeometry.worldMatrix.multiplyRightSide(venusScale);

    marsGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    marsGeometry.create(loadedAssets.marsJSON, loadedAssets.marsImage);
    // Scaled it down so that the diameter is 3
    var marsScale = new Matrix4().scale(0.025, 0.025, 0.025);
    marsGeometry.worldMatrix.setIdentity();
    marsGeometry.worldMatrix.multiplyRightSide(marsScale);

    jupitarGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    jupitarGeometry.create(loadedAssets.jupitarJSON, loadedAssets.jupitarImage);
    // Scaled it down so that the diameter is 3
    var jupitarScale = new Matrix4().scale(0.05, 0.05, 0.05);
    jupitarGeometry.worldMatrix.setIdentity();
    jupitarGeometry.worldMatrix.multiplyRightSide(jupitarScale);

    saturnGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    saturnGeometry.create(loadedAssets.saturnJSON, loadedAssets.saturnImage);
    // Scaled it down so that the diameter is 3
    var saturnScale = new Matrix4().scale(0.04, 0.04, 0.04);
    saturnGeometry.worldMatrix.setIdentity();
    saturnGeometry.worldMatrix.multiplyRightSide(saturnScale);

    uranusGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    uranusGeometry.create(loadedAssets.uranusJSON, loadedAssets.uranusImage);
    // Scaled it down so that the diameter is 3
    var uranusScale = new Matrix4().scale(0.035, 0.035, 0.035);
    uranusGeometry.worldMatrix.setIdentity();
    uranusGeometry.worldMatrix.multiplyRightSide(uranusScale);

    neptuneGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    neptuneGeometry.create(loadedAssets.neptuneJSON, loadedAssets.neptuneImage);
    // Scaled it down so that the diameter is 3
    var neptuneScale = new Matrix4().scale(0.03, 0.03, 0.03);
    neptuneGeometry.worldMatrix.setIdentity();
    neptuneGeometry.worldMatrix.multiplyRightSide(neptuneScale);

    atmGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    atmGeometry.create(loadedAssets.earthJSON, loadedAssets.atmImage);
    // Scaled it down so that the diameter is 3
    var atmScale = new Matrix4().scale(0.032, 0.032, 0.032);
    atmGeometry.worldMatrix.setIdentity();
    atmGeometry.worldMatrix.multiplyRightSide(atmScale);

    //here come's the earth
    earthGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    earthGeometry.create(loadedAssets.earthJSON, loadedAssets.earthImage);
    // Scaled it down so that the diameter is 3
    var scale = new Matrix4().scale(0.03, 0.03, 0.03);
    earthGeometry.worldMatrix.setIdentity();
    earthGeometry.worldMatrix.multiplyRightSide(scale);

    moonGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    moonGeometry.create(loadedAssets.moonJSON, loadedAssets.moonImage);
    // Scaled it down so that the diameter is 3
    var moonScale = new Matrix4().scale(0.01, 0.01, 0.01);

    moonGeometry.worldMatrix.setIdentity();
    moonGeometry.worldMatrix.multiplyRightSide(moonScale);

    var moonTran = new Matrix4().translate(25, 25, 25);
    moonGeometry.worldMatrix.multiplyRightSide(moonTran);

    atmGeometry.alpha = 0.2 + 0.8 * (.25 / 2);
    
    // raise it by the radius to make it sit on the ground
   // earthGeometry.worldMatrix.translate(0, 1.5, 0);

    
}

// -------------------------------------------------------------------------
function updateAndRender() {
    requestAnimationFrame(updateAndRender);

    var aspectRatio = gl.canvasWidth / gl.canvasHeight;

    time.update();
    

    var cosTime = Math.cos(time.secondsElapsedSinceStart * .8);
    var sinTime = Math.sin(time.secondsElapsedSinceStart * .8);

    // special case rotation where the vector is along the x-axis (4, 0)
    //roatating planets 
    var earthDistance = 13;
    planetPosition.x = cosTime * earthDistance;
    planetPosition.y = 0.0;
    planetPosition.z = sinTime * earthDistance;

    earthGeometry.worldMatrix.elements[3] =  planetPosition.x;
    earthGeometry.worldMatrix.elements[7] =  planetPosition.y;
    earthGeometry.worldMatrix.elements[11] = planetPosition.z;

    atmGeometry.worldMatrix.elements[3] =  planetPosition.x;
    atmGeometry.worldMatrix.elements[7] =  planetPosition.y;
    atmGeometry.worldMatrix.elements[11] = planetPosition.z;

    camera.update(time.deltaTime);


    var cosTimeMoon = Math.cos(time.secondsElapsedSinceStart * 2.0);
    var sinTimeMoon = Math.sin(time.secondsElapsedSinceStart * 2.0);


    var moonTran = new Matrix4().translate(planetPosition.x, planetPosition.y, planetPosition.z);
    moonGeometry.worldMatrix.multiplyRightSide(moonTran);
    
    moonGeometry.worldMatrix.elements[3] = planetPosition.x+1.5;
    moonGeometry.worldMatrix.elements[7] = 0.0;
    moonGeometry.worldMatrix.elements[11] = planetPosition.z + 1.5;

    var moonDistance =3.0;
    moonPosition.x = cosTimeMoon * moonDistance;
    moonPosition.y = 0.0;
    moonPosition.z = sinTimeMoon * moonDistance;

    moonGeometry.worldMatrix.elements[3] =  planetPosition.x + moonPosition.x;
    moonGeometry.worldMatrix.elements[7] =  0.0;
    moonGeometry.worldMatrix.elements[11] = planetPosition.z + moonPosition.z;



    var cosTimeMer = Math.cos(time.secondsElapsedSinceStart * 1.0);
    var sinTimeMer = Math.sin(time.secondsElapsedSinceStart * 1.0);

    var mercuryDistance = 5;
    mercuryPosition.x = cosTimeMer * mercuryDistance;
    mercuryPosition.y = 0.0;
    mercuryPosition.z = sinTimeMer * mercuryDistance;


    mercuryGeometry.worldMatrix.elements[3] = mercuryPosition.x;
    mercuryGeometry.worldMatrix.elements[7] = 0.0;
    mercuryGeometry.worldMatrix.elements[11] = mercuryPosition.z;

    var cosTimeVen = Math.cos(time.secondsElapsedSinceStart * 0.9);
    var sinTimeVen = Math.sin(time.secondsElapsedSinceStart * 0.9);

    var venusDistance = 9;
    venusPosition.x = cosTimeVen * venusDistance;
    venusPosition.y = 0.0;
    venusPosition.z = sinTimeVen * venusDistance;

    venusGeometry.worldMatrix.elements[3] = venusPosition.x;
    venusGeometry.worldMatrix.elements[7] = venusPosition.y;
    venusGeometry.worldMatrix.elements[11] = venusPosition.z;


     var cosTimeMar = Math.cos(time.secondsElapsedSinceStart * 0.7);
    var sinTimeMar = Math.sin(time.secondsElapsedSinceStart * 0.7);

    var marsDistance = 17;
    marsPosition.x = cosTimeMar * marsDistance;
    marsPosition.y = 0.0;
    marsPosition.z = sinTimeMar * marsDistance;

    marsGeometry.worldMatrix.elements[3] = marsPosition.x;
    marsGeometry.worldMatrix.elements[7] = marsPosition.y;
    marsGeometry.worldMatrix.elements[11] = marsPosition.z;

     var cosTimeJup = Math.cos(time.secondsElapsedSinceStart * 0.5);
    var sinTimeJup = Math.sin(time.secondsElapsedSinceStart * 0.5);

    var jupitarDistance = 21;
    jupitarPosition.x = cosTimeJup * jupitarDistance;
    jupitarPosition.y = 0.0;
    jupitarPosition.z = sinTimeJup * jupitarDistance;

    jupitarGeometry.worldMatrix.elements[3] = jupitarPosition.x;
    jupitarGeometry.worldMatrix.elements[7] = jupitarPosition.y;
    jupitarGeometry.worldMatrix.elements[11] = jupitarPosition.z;

    var saturnDistance = 24;
    saturnPosition.x = cosTimeMar * saturnDistance;
    saturnPosition.y = 0.0;
    saturnPosition.z = sinTimeMar * saturnDistance;

    saturnGeometry.worldMatrix.elements[3] = saturnPosition.x;
    saturnGeometry.worldMatrix.elements[7] = saturnPosition.y;
    saturnGeometry.worldMatrix.elements[11] = saturnPosition.z;

    var uranusDistance = 27;
    uranusPosition.x = cosTimeMer * uranusDistance;
    uranusPosition.y = 0.0;
    uranusPosition.z = sinTimeMer * uranusDistance;

    uranusGeometry.worldMatrix.elements[3] = uranusPosition.x;
    uranusGeometry.worldMatrix.elements[7] = uranusPosition.y;
    uranusGeometry.worldMatrix.elements[11] = uranusPosition.z;


    var neptuneDistance = 30;
    neptunePosition.x = cosTime * neptuneDistance;
    neptunePosition.y = 0.0;
    neptunePosition.z = sinTime * neptuneDistance;

    neptuneGeometry.worldMatrix.elements[3] = neptunePosition.x;
    neptuneGeometry.worldMatrix.elements[7] = neptunePosition.y;
    neptuneGeometry.worldMatrix.elements[11] = neptunePosition.z;

    var rotate = new Matrix4().setRotationY(.5);
    sunGeometry.worldMatrix.multiplyRightSide(rotate);
    earthGeometry.worldMatrix.multiplyRightSide(rotate);
    mercuryGeometry.worldMatrix.multiplyRightSide(rotate);
    venusGeometry.worldMatrix.multiplyRightSide(rotate);
    marsGeometry.worldMatrix.multiplyRightSide(rotate);
    jupitarGeometry.worldMatrix.multiplyRightSide(rotate);
    saturnGeometry.worldMatrix.multiplyRightSide(rotate);
    uranusGeometry.worldMatrix.multiplyRightSide(rotate);
    neptuneGeometry.worldMatrix.multiplyRightSide(rotate);
    atmGeometry.worldMatrix.multiplyRightSide(rotate);
    moonGeometry.worldMatrix.multiplyRightSide(rotate);

    // specify what portion of the canvas we want to draw to (all of it, full width and height)
    gl.viewport(0, 0, gl.canvasWidth, gl.canvasHeight);

    // this is a new frame so let's clear out whatever happened last frame
    gl.clearColor(0.707, 0.707, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var cameraPosition = camera.getPosition();
    // var cameraPosition = new Vector3(planetPosition.x,planetPosition.y,planetPosition.z);
    projectionMatrix.setPerspective(45, aspectRatio, 0.1, 1000);

    camera.cameraWorldMatrix.setLookAt(cameraPosition, new Vector3(planetPosition.x,planetPosition.y,planetPosition.z), new Vector3(0, 1, 0));

    //camera.cameraWorldMatrix.setLookAt(cameraPosition, new Vector3(0,0,0), new Vector3(0, 1, 0));



     //sunGeometry is lightGeometry
    gl.useProgram(phongShaderProgram);
    var uniforms = phongShaderProgram.uniforms;
    gl.uniform3f(uniforms.planetPositionUniform, sunGeometry.worldMatrix.elements[3], sunGeometry.worldMatrix.elements[7], sunGeometry.worldMatrix.elements[11]);
    //gl.uniform3f(uniforms.worldMatrixUniform,planetPosition.x,planetPosition.y,planetPosition.z);
    gl.uniform3f(uniforms.cameraPositionUniform, cameraPosition.x, cameraPosition.y, cameraPosition.z);



    sunGeometry.render(camera, projectionMatrix, phongShaderProgram);
    skyGeo1.render(camera, projectionMatrix, phongShaderProgram);
    skyGeo2.render(camera, projectionMatrix, phongShaderProgram);
    skyGeo3.render(camera, projectionMatrix, phongShaderProgram);
    skyGeo4.render(camera, projectionMatrix, phongShaderProgram);
    skyGeo5.render(camera, projectionMatrix, phongShaderProgram);
    mercuryGeometry.render(camera, projectionMatrix, phongShaderProgram);
    venusGeometry.render(camera, projectionMatrix, phongShaderProgram);
    marsGeometry.render(camera, projectionMatrix, phongShaderProgram);
    jupitarGeometry.render(camera, projectionMatrix, phongShaderProgram);
    saturnGeometry.render(camera, projectionMatrix, phongShaderProgram);
    uranusGeometry.render(camera, projectionMatrix, phongShaderProgram);
    neptuneGeometry.render(camera, projectionMatrix, phongShaderProgram);
    moonGeometry.render(camera, projectionMatrix, phongShaderProgram);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // gl.useProgram(phongShaderProgram);
    // var uniforms1 = phongShaderProgram.uniforms;
    // gl.uniform3f(uniforms1.planetPositionUniform, planetPosition.x,planetPosition.y,planetPosition.z);
    // gl.uniform3f(uniforms1.cameraPositionUniform, cameraPosition.x, cameraPosition.y, cameraPosition.z);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    //groundGeometry.render(camera, projectionMatrix, phongShaderProgram);
    earthGeometry.render(camera, projectionMatrix, phongShaderProgram);
    atmGeometry.render(camera, projectionMatrix, phongShaderProgram);
    gl.disable(gl.BLEND);
    // gl.useProgram(basicColorProgram);
    // var uniforms1 = basicColorProgram.uniforms;

   // skyGeo.render(camera, projectionMatrix, basicColorProgram);
 


   
}
