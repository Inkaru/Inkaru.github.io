// outside shader
const vshader = `    
#include <noise>

varying float noise;
uniform float uTime;

void main() {
  // noise = turbulence( .7 * normal + uTime );
  // float b = 5.0 * pnoise( 0.05 * position + vec3( 2.0 * uTime), vec3( 100.0 ) );
  // float displacement = noise + b;

  // vec3 pos = position + 0.2 * normal * displacement;
  // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

  noise = 2. * turbulence( 0.7 * normal + 0.3 * position + 0.6 * uTime );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`

const fshader = `
varying float noise;
uniform float uTime;

void main() {
  float v = 1.5 * ((sin(noise) + 1.) / 2.);
  float r = v * ((sin(uTime / 3.) + 1.) / 2.);
  float b = v * ((cos(uTime / 3.) + 1.) / 4.) + 0.5;
  vec3 color = vec3( v * r, 0, v * b);
  gl_FragColor = vec4( color, 1.0 );

}
`

// inside shader
const vshader2 = `    
#include <noise>

varying float noise;
uniform float uTime;

void main() {
  noise = 1.1 * turbulence( .03 * normal + 0.03 * position + 0.2 * uTime );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

const fshader2 = `
varying float noise;
uniform float uTime;

void main() {
  vec3 color = vec3(abs(noise) * 2.);
  gl_FragColor = vec4( color, abs(noise) - 0.1);

}
`

var scene, camera, renderer, clock, composer;
var normal, binormal, tube;
var uniforms;
var tardis;

// Knot Curve
function KnotCurve(scale) {
  THREE.Curve.call( this );
  this.scale = ( scale === undefined ) ? 1 : scale;
}

KnotCurve.prototype = Object.create( THREE.Curve.prototype );
KnotCurve.prototype.constructor = KnotCurve;

KnotCurve.prototype.getPoint = function ( t, optionalTarget ) {

  var point = optionalTarget || new THREE.Vector3();

  t *= 2 * Math.PI;

  var R = 10;
  var s = 50;

  var x = s * Math.sin( t );
  var y = Math.cos( t ) * ( R + s * Math.cos( t ) );
  var z = Math.sin( t ) * ( R + s * Math.cos( t ) );

  return point.set( x, y, z ).multiplyScalar( this.scale );;

};

function init(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, 15 );
  camera.position.set(0, 3, 10);
  
  const ambient = new THREE.HemisphereLight(0xffffbb, 0x080820);
  scene.add(ambient);
  
  const light = new THREE.DirectionalLight(0xFFFFFF, 1);
  light.position.set( 1, 10, 6);
  scene.add(light);
  
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.antialias = true;
  document.body.appendChild( renderer.domElement );

  clock = new THREE.Clock();
  
  uniforms = {
    uTime: { value: 0.0 }
  }
  
  var material = new THREE.ShaderMaterial( {
    uniforms: uniforms,
    vertexShader: vshader,
    fragmentShader: fshader,
    side: THREE.BackSide,
    transparent: false
  } );

  var material2 = new THREE.ShaderMaterial( {
    uniforms: uniforms,
    vertexShader: vshader2,
    fragmentShader: fshader2,
    side: THREE.BackSide,
    transparent: true
  } );

  var curve = new KnotCurve(0.22);
  //Add meshes here

  // TUBE
  var geometry = new THREE.TubeBufferGeometry(curve,100,1.5,15,true);
  tube = new THREE.Mesh( geometry, material );
  scene.add( tube );

  var geometry2 = new THREE.TubeBufferGeometry(curve,100,1.45,25,true);
  var tube2 = new THREE.Mesh( geometry2, material2 );
  scene.add( tube2 );
  
  window.addEventListener( 'resize', resize, false);

  // TARDIS
  var meshMaterial = new THREE.MeshPhongMaterial( { wireframe: false } );
  // Instantiate a loader
  var objloader = new THREE.OBJLoader();
  tardis = new THREE.Group();
  var scale = 0.04;
  objloader.load(
    './tardis.obj',
    function(object) {
      object.traverse(function(child){
        if(child.isMesh) {
          child.material = meshMaterial;
          child.scale.set(scale,scale,scale);
        }    
      });
      tardis.add(object);
    }
  );

  scene.add(tardis);

  // postprocessing
  composer = new THREE.EffectComposer( renderer );
  composer.addPass( new THREE.RenderPass( scene, camera ) );

  var shaderVignette = THREE.VignetteShader;
  var effectVignette = new THREE.ShaderPass(shaderVignette);
  effectVignette.uniforms[ "tDiffuse" ].value = null;
  effectVignette.uniforms[ "offset" ].value = 1.4;
  effectVignette.uniforms[ "darkness" ].value = 1.2;
  effectVignette.renderToScreen = true;
  composer.addPass(effectVignette);
  
  update();
}

init();

function update(){
  requestAnimationFrame( update );
  uniforms.uTime.value += clock.getDelta();
  updateCamera();
  tardis.rotation.y += 0.05;
  // tardis.rotation.z += 0.01*Math.cos(uniforms.uTime.value);
  //renderer.render( scene, camera );
  composer.render();
}

function updateCamera(){
  const time = clock.getElapsedTime();
  const looptime = 20;
	const t = ( time % looptime ) / looptime;
  const t2 = ( (time + 0.2) % looptime) / looptime

  const pos = tube.geometry.parameters.path.getPointAt( t );
  const pos2 = tube.geometry.parameters.path.getPointAt( t2 );
  tardis.position.copy(pos2);

  camera.position.copy(pos);
  camera.lookAt(pos2);
}

function resize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

