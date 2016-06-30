# FPS Controls for Three.js
A 3D platformer game made with Three.js. The aim of the game is to the get to the top of the crates, at which point they will back to their rightful
place on the moons surface in an orderly fashion.

[Here is a live demo](https://jamesmilner.github.io/threejs-fps-controls)

# Features
The controls and demo are based on the [PointerLockControls](https://github.com/mrdoob/three.js/blob/master/examples/js/controls/PointerLockControls.js) given in the
three.js examples page/repo. The controls add additional benefits:

* Double Jump (Optional)
* Crouching
* Walking
* Elementary collision detection with specified objects

# Future Plans

* Improved collision detection
* Refactoring to improve code readability and control robustness
* Strafe jumping (long term)

# How To

Import three.js, then import FPSControls.js. You can then do something like this:

```javascript
camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 9000 );
controls = new THREE.PointerLockControls( camera, 100, 30, true, objects );
scene.add( controls.getPlayer() );
```
Then in your animation loop you just need to call the update controls method:

```javascript
controls.updateControls();
```

# Contributing

I would love contributions! Both in the form of issues, feature requests, usage examples and of course pull requests.

# License
MIT
