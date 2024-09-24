import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe0e0e0);

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Camera setup
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);

const light = new THREE.DirectionalLight(0xffffff, 1);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const pointLight = new THREE.PointLight(0xffffff, 1);
scene.add(light);
scene.add(ambientLight);
scene.add(pointLight);
// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(sizes.width, sizes.height);
document.body.appendChild(renderer.domElement);

//camera position will be from top left corner
camera.position.z = 10;
camera.position.y = 5;
camera.position.x = 8;
camera.lookAt(scene.position);

const roomGeometry = new THREE.BoxGeometry(10, 5, 10);
const roomMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.5,
  roughness: 0.5,
  side: THREE.BackSide,
});
const room = new THREE.Mesh(roomGeometry, roomMaterial);
scene.add(room);

const roomTextureLoader = new THREE.TextureLoader();
const roomTextures = [
  roomTextureLoader.load("./static/wall/Bricks059_1K-PNG_AmbientOcclusion.png"),
  roomTextureLoader.load("./static/wall/Bricks059_1K-PNG_Color.png"),
  roomTextureLoader.load("./static/wall/Bricks059_1K-PNG_NormalGL.png"),
  roomTextureLoader.load("./static/wall/Bricks059_1K-PNG_Roughness.png"),
  roomTextureLoader.load("./static/wall/Bricks059_1K-PNG_Displacement.png"),
];
roomMaterial.map = roomTextures[1];
roomMaterial.aoMap = roomTextures[0];
roomMaterial.normalMap = roomTextures[2];
roomMaterial.roughnessMap = roomTextures[3];
roomMaterial.displacementMap = roomTextures[4];

// Load 3D models
const loader = new GLTFLoader();
let tvModel, standModel;

loader.load(
  "/static/tv-with-stand.glb",
  (gltf) => {
    tvModel = gltf.scene;
    tvModel.position.set(0, 0, -4);
    tvModel.scale.set(0.05, 0.05, 0.05);
    scene.add(tvModel);
  },
  undefined,
  (error) => {
    console.error(error);
  }
);

//set light to the TV model
light.position.set(0, 0, -4);

loader.load(
  "./static/tv_stand.glb",
  (gltf) => {
    standModel = gltf.scene;
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.5,
      envMapIntensity: 1,
      transparent: true,
      opacity: 0.9,
    });
    standModel.traverse((node) => {
      if (node.isMesh) {
        node.material = glassMaterial;
      }
    });

    standModel.position.set(0, -2, -4); // Move to the back wall
    scene.add(standModel);
  },
  undefined,
  (error) => {
    console.error(error);
  }
);
// load sofa
let sofaModel = null;
loader.load(
  "./static/sofa.glb",
  (gltf) => {
    sofaModel = gltf.scene;
    // sofaModel.position.set(10, -2.4, 3);
    // make the sofa into more right side
    sofaModel.position.set(10, -2.4, 3);
    // Create a mirrored clone of the sofa model
    const mirroredSofaModel = sofaModel.clone();
    mirroredSofaModel.scale.set(2, 2, 2);
    mirroredSofaModel.scale.z *= -1; // Mirror along the X-axis
    mirroredSofaModel.position.x = -2; // Adjust mirrored position
    ambientLight.position.set(10, -2, 0);
    scene.add(mirroredSofaModel);
    //add light to the sofa
  },
  undefined,
  (error) => {
    console.error(error);
  }
);

// load the sofa model
console.log(sofaModel);
// mirror the sofa
// Load textures for the TV screen
const textureLoader = new THREE.TextureLoader();
const textures = [
  textureLoader.load("texture-1.jpg"),
  textureLoader.load("./static/images/ac-1.jpg"),
  textureLoader.load("./static/images/ac-2.jpg"),
  textureLoader.load("./static/images/ac-3.jpg"),
];

let currentTextureIndex = 0;
const mouse = {
  x: 0,
  y: 0,
  zoomSpeed: 0.1,
};

// window.addEventListener("mousemove", (event) => {
//   mouse.x = event.clientX / sizes.width - 0.5;
//   mouse.y = event.clientY / sizes.height - 0.5;
//   camera.position.x = mouse.x * 5;
//   camera.position.y = -mouse.y * 5;
//   camera.lookAt(scene.position);
// });
// add mouse move when clicked and dragged to move the camera, move the whole scene
let isDragging = false;
let previousMousePosition = {
  x: 0,
  y: 0,
};
window.addEventListener("mousedown", (event) => {
  isDragging = true;
  previousMousePosition = {
    x: event.clientX,
    y: event.clientY,
  };
});
window.addEventListener("mouseup", () => {
  isDragging = false;
});
window.addEventListener("mousemove", (event) => {
  if (isDragging) {
    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;
    camera.position.x += deltaX * 0.1;
    camera.position.y -= deltaY * 0.1;
    camera.lookAt(scene.position);
    previousMousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
  }
});
// add zoom in and out when scrolling

window.addEventListener("wheel", (event) => {
  camera.position.z += event.deltaY * 0.01;
  camera.position.z = Math.max(camera.position.z, 2);
  camera.position.z = Math.min(camera.position.z, 20);
  camera.lookAt(scene.position);
});

let angle = 0;
function animate() {
  angle += 0.01;
  light.position.set(5 * Math.cos(angle), 5, 5 * Math.sin(angle));

  if (tvModel) {
    tvModel.traverse((node) => {
      if (node.isMesh && node.material.map) {
        node.material.map = textures[currentTextureIndex];
        node.material.needsUpdate = true;
      }
    });
  }

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
renderer.gammaInput = true;
renderer.gammaOutput = true;
// Change texture on TV screen every 5 seconds
setInterval(() => {
  currentTextureIndex = (currentTextureIndex + 1) % textures.length;
  if (tvModel) {
    tvModel.traverse((node) => {
      if (node.isMesh && node.material.map) {
        node.material.map = textures[currentTextureIndex];
        node.material.needsUpdate = true;
      }
    });
  }
}, 500);
const listener = new THREE.AudioListener();
camera.add(listener);

// create a global audio source
const sound = new THREE.Audio(listener);

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load("./Ac.mp3", function (buffer) {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(1.0);
  //sound.play();
});
