/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function ( camera, mass, playerHeight, doubleJump, worldObjects ) {

	var scope = this;

	scope.worldObjects = worldObjects;

	camera.rotation.set( 0, 0, 0 );

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );

	var yawObject = new THREE.Object3D();
	yawObject.position.y = playerHeight;
	yawObject.add( pitchObject );

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y -= movementX * 0.002;
		pitchObject.rotation.x -= movementY * 0.002;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

	};

	scope.dispose = function() {

		document.removeEventListener( 'mousemove', onMouseMove, false );

	};

	document.addEventListener( 'mousemove', onMouseMove, false );

	scope.enabled = false;

	scope.getObject = function () {

		return yawObject;

	};

	scope.getDirection = function() {

		// assumes the camera itself is not rotated

		var direction = new THREE.Vector3( 0, 0, - 1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

		return function( v ) {

			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

			v.copy( direction ).applyEuler( rotation );

			return v;

		};

	}();

	// FPS Controls Additions

	scope.updatePlayerHeight = function(height) {
		yawObject.position.y = height;
	};

	scope.raycasters = {

		down : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 20 ),
		up : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, 1, 0 ), 0, 20 ),
		forward : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(0, 0, -1), 0, 15 ),
		backward : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 15 ),
		left : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 15 ),
		right : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 15 ),
		rightStrafe : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 30 ),
		leftStrafe : new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 30 ),

	};

	scope.doubleJump = doubleJump;
	scope.baseHeight = 0; // The minimum plane height
	scope.mass = mass || 100;
	scope.originalMass = mass;
	scope.walkingSpeed = 3000; // Higher = slower
	scope.speed = 900; // Movement speed
	scope.jumpFactor = 90; // Jump height
	scope.velocity = new THREE.Vector3(1, 1, 1);

	scope.moveForward = false;
	scope.moveBackward = false;
	scope.moveLeft = false;
	scope.moveRight = false;
	scope.jumps = 0;
	scope.firstJump = true;
	scope.walking = false;

	// Crouched
	scope.crouching = false;
	var crouchSmoothing;
	var smoothedHeight;
	var crouched = false;

	// Jump Variables
	scope.jumping = false;

	scope.jump = function() {
		scope.jumping = true;
	};

	scope.crouch = function(boolean) {
		scope.crouching = boolean;
	};

	scope.walk = function(boolean) {
		scope.walking = boolean;
	};

	// So you can update the world objects when they change
	scope.updateWorldObjects = function(worldObjects) {
		scope.worldObjects = worldObjects;
	};

	scope.updateControls = function() {
		//scope.walking = false;
		scope.time = performance.now();
		scope.unlockMovement();

		// Check change and if Walking?
		scope.delta = (scope.walking) ? ( scope.time - scope.prevTime ) / scope.walkingSpeed : ( scope.time - scope.prevTime ) / scope.speed;
		var validDelta = isNaN(scope.delta) === false;
		if (validDelta) {

			// Velocities
			scope.velocity.x -= scope.velocity.x * 8.0 * scope.delta; // Left and right
			scope.velocity.z -= scope.velocity.z * 8.0 * scope.delta; // Forward and back
			scope.velocity.y -= (scope.walking) ?  9.8 * scope.mass * scope.delta : 5.5 * scope.mass * scope.delta;  // Up and Down

			scope.camDir = scope.getObject().getWorldDirection().negate(); //
			scope.playersPosition = scope.getObject().position.clone();

			scope.raycasters.up.ray.origin.copy(scope.playersPosition);
			scope.raycasters.down.ray.origin.copy(scope.playersPosition);
			scope.raycasters.forward.ray.set(scope.playersPosition, scope.camDir);
			scope.raycasters.backward.ray.set(scope.playersPosition, scope.camDir.negate());
			scope.raycasters.left.ray.set(scope.playersPosition, scope.camDir.applyMatrix4( new THREE.Matrix4().makeRotationY(- (Math.PI / 2) )));
			scope.raycasters.right.ray.set(scope.playersPosition, scope.camDir.applyMatrix4( new THREE.Matrix4().makeRotationY( Math.PI )));
			scope.raycasters.rightStrafe.ray.set(scope.playersPosition, scope.camDir.applyMatrix4( new THREE.Matrix4().makeRotationY(  (Math.PI / 4) ))); // Working
			scope.raycasters.leftStrafe.ray.set(scope.playersPosition, scope.camDir.applyMatrix4( new THREE.Matrix4().makeRotationY(  (Math.PI / 4) )));

			scope.upwardsIntersection = scope.raycasters.up.intersectObjects(worldObjects );
			scope.downwardsIntersection = scope.raycasters.down.intersectObjects(worldObjects );
			scope.forwardsIntersection = scope.raycasters.forward.intersectObjects(worldObjects );
			scope.backwardsIntersection = scope.raycasters.backward.intersectObjects(worldObjects );
			scope.leftIntersection = scope.raycasters.left.intersectObjects(worldObjects );
			scope.rightIntersection = scope.raycasters.right.intersectObjects(worldObjects );
			scope.rightStrafeIntersection = scope.raycasters.rightStrafe.intersectObjects(worldObjects );
			scope.leftStrafeIntersection = scope.raycasters.leftStrafe.intersectObjects(worldObjects );

			scope.isRightStafeOfObject = scope.rightStrafeIntersection.length > 0;
			if (scope.isRightStafeOfObject) { scope.lockMoveRight = true; scope.lockMoveFoward = true; }

			scope.isLeftStafeOfObject = scope.leftStrafeIntersection.length > 0;
			if (scope.isLeftStafeOfObject) { scope.lockMoveLeft = true; scope.lockMoveFoward = true; }

			scope.isLeftOfObject = scope.leftIntersection.length > 0;
			if (scope.isLeftOfObject) { scope.lockMoveLeft = true; }

			scope.isRightOfObject = scope.rightIntersection.length > 0;
			if (scope.isRightOfObject) { scope.lockMoveRight = true; }

			scope.isInfrontObject = scope.forwardsIntersection.length > 0;
			if (scope.isInfrontObject) { scope.lockMoveForward = true; }

			scope.isBehindObject = scope.backwardsIntersection.length > 0;
			if (scope.isBehindObject) { scope.lockMoveBackward = true; }

			// If your head hits an object, turn your mass up to make you fall back to earth
			scope.isBelowObject = scope.upwardsIntersection.length > 0;
			if ( scope.isBelowObject === true ) {
				this.mass = 500;
			}
			else { scope.mass = scope.originalMass; }

			scope.isOnObject = scope.downwardsIntersection.length > 0;
			if ( scope.isOnObject === true ) {
				scope.velocity.y = Math.max( 0, scope.velocity.y );
				scope.jumps = 0;

				//If we start to fall through an object
				if ((this.getObject().position.y  < playerHeight) &&
					 scope.downwardsIntersection &&
					 scope.downwardsIntersection[0].distance < (playerHeight / 2) ) {

					 this.getObject().position.y += 0.1;
				}

			} else {
				this.walking = false;
			}

			// Crouched
			if (scope.crouching && scope.isOnObject) {

				scope.walking = true;
				if (!crouched && !scope.justCrouched) {
					scope.updatePlayerHeight(scope.getObject().position.y - (playerHeight * 0.2));
					crouchSmoothing = 0;
					smoothedHeight = 0;
					crouched = true;

					 // Stop people from crouching through the floor
					scope.justCrouched = true;
					setTimeout(function() { scope.justCrouched = false; }, 300);
				}

			} else if (!scope.crouching && smoothedHeight <= (playerHeight - 5) ){

				smoothedHeight = scope.getObject().position.y + crouchSmoothing;
				scope.updatePlayerHeight(smoothedHeight);
				crouchSmoothing += 0.333;
				crouched = false;
				scope.walking = false;

			}

			// Jumping - must come after isBelowObject but before isOnObject
			if (scope.jumping) {

				scope.walking = false;
				scope.crouching = false;

				if (scope.jumps === 0 && !scope.isBelowObject) {
					scope.velocity.y += scope.jumpFactor * 2.3;
					scope.jumps = 1;
				}
				else if (scope.doubleJump && scope.jumps === 1 && !scope.isOnObject && !scope.isBelowObject) {
					scope.velocity.y += scope.jumpFactor * 1.5;
					scope.jumps = 2;
				}

			}

			// Movements
			if ( scope.moveForward && !scope.walking && !scope.lockMoveForward) scope.velocity.z -= 400.0 * scope.delta;
			if ( scope.moveForward && scope.walking && !scope.lockMoveForward) scope.velocity.z -= 1000.0 * scope.delta;
			if ( scope.moveBackward && !scope.lockMoveBackward ) scope.velocity.z += 400.0 * scope.delta;
			if ( scope.moveLeft && !scope.lockMoveLeft ) scope.velocity.x -= 400.0 * scope.delta;
			if ( scope.moveRight && !scope.lockMoveRight ) scope.velocity.x += 400.0 * scope.delta;

			// Velocity translations
			scope.getObject().translateX( scope.velocity.x * scope.delta );
			scope.getObject().translateY( scope.velocity.y * scope.delta );
			scope.getObject().translateZ( scope.velocity.z * scope.delta );

			scope.jumping = false;

		}

		scope.prevTime = scope.time; // Set the previous time to the time we set at the begining

	};

	scope.unlockMovement = function() {
		scope.lockMoveForward = false;
		scope.lockMoveBackward = false;
		scope.lockMoveLeft = false;
		scope.lockMoveRight = false;
	};

};
