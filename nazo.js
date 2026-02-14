var KL = KL || {};

KL.Particle = function(x, y, z, color, gV) {

	this.v = new KL.V3(x, y, z);
	this.oldV = new KL.V3(x, y, z);
	this.gV = gV || null;
	this.color = color || new KL.color();
	this.velocity = new KL.V3();
	this.length = 0;

	this.move = function () {
	
		var dx = this.gV.x - this.v.x;
		var dy = this.gV.y - this.v.y;
		var dz = this.gV.z - this.v.z;
		var d = Math.sqrt( dx*dx + dy*dy + dz*dz );
		if (d<0.5) {
			var rnd = Math.random()*3;
			dx = this.velocity.x + rnd*dx/d;
			dy = this.velocity.y + rnd*dy/d;
			dz = this.velocity.z + rnd*dz/d;
		}
		else {
			
			dx = this.velocity.x + 0.2*dx/d;
			dy = this.velocity.y + 0.2*dy/d;
			dz = this.velocity.z + 0.2*dz/d;
		}
		this.velocity.set(dx, dy, dz);
		this.velocity.multiply(0.975);

		

		this.oldV.x = this.v.x;
		this.oldV.y = this.v.y;
		this.oldV.z = this.v.z;
		this.oldV.px = this.v.px;
		this.oldV.py = this.v.py;
		this.v.add(this.velocity);
	};

	this.toString = function () {
		return 'KL.Particle ( ' + this.v.x + ', ' + this.v.y + ', ' + this.v.z + ' )';
	};
}

KL.Color = function( r, g, b, a ) {

	this.getColor = function () {
		if (this.a>=1) return 'rgb('+this.r+','+this.g+','+this.b+')';
		else return 'rgba('+this.r+','+this.g+','+this.b+','+this.a+')';
	};

	this.r = r || 255;
	this.g = g || 255;
	this.b = b || 255;
	this.a = a || 1;
	this._str = this.getColor();
	
	this.setAlpha = function (a) {
		this.a = minmax(a, 0, 1);
		this._str = this.getColor();
	};

	this.toString = function () {
		return this._str;
	};
}

KL.V3 = function ( x, y, z ) {

	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;

	this.px = 0;
	this.py = 0;

	this.set = function ( x, y, z ) {
		this.x = x;
		this.y = y;
		this.z = z;

		return this;
	};

	this.add = function ( v ) {
		this.x+= v.x;
		this.y+= v.y;
		this.z+= v.z;
	};

	this.multiply = function ( n ) {
		this.x*= n;
		this.y*= n;
		this.z*= n;
	};

	this.divide = function ( n ) {
		this.x/= n;
		this.y/= n;
		this.z/= n;
	};

	this.length = function () {
		return Math.sqrt( this.x*this.x + this.y*this.y + this.z*this.z );
	};

	this.toString = function () {
		return 'KL.V3 ( ' + this.x + ', ' + this.y + ', ' + this.z + ' )';
	};
};

KL.M3 = function ( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

	this.n11 = n11 || 1; this.n12 = n12 || 0; this.n13 = n13 || 0;
	this.n21 = n21 || 0; this.n22 = n22 || 1; this.n23 = n23 || 0;
	this.n31 = n31 || 0; this.n32 = n32 || 0; this.n33 = n33 || 1;
	
	this.rot = function (rx, ry, rz) {
		var cosx=Math.cos(rx), sinx=Math.sin(rx);
		var cosy=Math.cos(ry), siny=Math.sin(ry);
		var cosz=Math.cos(rz), sinz=Math.sin(rz);

		this.n11 = cosz*cosy; 
		this.n12 = sinz*cosy; 
		this.n13 = -siny;

		this.n21 = cosz*siny*sinx - sinz*cosx; 
		this.n22 = sinz*siny*sinx + cosx*cosz; 
		this.n23 = sinx*cosy;

		this.n31 = cosz*siny*cosx + sinz*sinx; 
		this.n32 = sinz*siny*cosx - cosz*sinx; 
		this.n33 = cosx*cosy;
	};

	this.xV3 = function ( v ) {
	
		var vx = v.x,
			vy = v.y,
			vz = v.z;

		v.x = this.n11 * vx + this.n12 * vy + this.n13 * vz;
		v.y = this.n21 * vx + this.n22 * vy + this.n23 * vz;
		v.z = this.n31 * vx + this.n32 * vy + this.n33 * vz;

		return v;
	};

	this.xParticle = function ( p ) {

		var v = p.v,
			oldV = p.oldV;
		oldV.x = v.x;
		oldV.y = v.y;
		oldV.z = v.z;
		oldV.px = v.px;
		oldV.py = v.py;

		this.xV3(v)

		return p;
	};
};

function minmax(x, min, max) {
	if (x<min) return min;
	else if (x>max) return max;
	else return x;
}

(function(){
	var NUM_BRANCHES = 32;
	var NUM_PER_BRANCH = 16;
	var NUM_PARTICLES = NUM_BRANCHES*NUM_PER_BRANCH;
	var MAX = 20;

	var $container = $('#container');
	var CANVAS_WIDTH = $container.width();
	var CANVAS_HEIGHT = $container.height();
	var CANVAS_OX = CANVAS_WIDTH/2;
	var CANVAS_OY = CANVAS_HEIGHT/2;

	var CONTAINER_WIDTH = CANVAS_WIDTH;
	var CONTAINER_HEIGHT = CANVAS_HEIGHT;
	var CONTAINER_OX = CANVAS_OX;
	var CONTAINER_OY = CANVAS_OY;
	
	var PI2 = Math.PI*2;

	var container, canvas, context;

	var particles = [];
	var rotMatrix = new KL.M3();
	var rotX, rotY, rotZ;
	var cnt = 0;
	var gV = new KL.V3();

	var mouseOver = false, mouseDown = false, mouseX = 0, mouseY = 0;
	var speedX = 0.05 * Math.PI / CONTAINER_WIDTH,
		speedY = 0.05 * Math.PI / CONTAINER_HEIGHT;

	init();

	function init() {
	
		initParticles();

		container = document.getElementById( 'container' );
		canvas = document.getElementById( 'canvas' );
		context = canvas.getContext('2d');
		
		canvas.width = CANVAS_WIDTH;
		canvas.height = CANVAS_HEIGHT;

		container.addEventListener( 'mouseover', onMouseOver, false );
		container.addEventListener( 'mouseout', onMouseOut, false );
		container.addEventListener( 'mousemove', onMouseMove, false );
		container.addEventListener( 'mousedown', onMouseDown, false );
		container.addEventListener( 'mouseup', onMouseUp, false );
		container.addEventListener( 'touchstart', onTouchStart, false );
		container.addEventListener( 'touchmove', onTouchMove, false );
   
  $(window).on('resize', function(){
    
  })
   

		setInterval( loop, 1000 / 30 );

	}

	function initParticles() {
		particles = [];
		
		
		for (var i=0; i<NUM_PARTICLES; i++) {
			var x = Math.random()*MAX-MAX/2,
				y = Math.random()*MAX-MAX/2,
				z = Math.random()*MAX-MAX/2,
				color = new KL.Color(
					Math.floor(Math.random()*255),
					Math.floor(Math.random()*255),
					Math.floor(Math.random()*255),
					0.5+0.5*Math.random()
				);
			var particle = new KL.Particle(x, y, z, color, gV);
			particles.push(particle);
		}
		
		
		for (var i=0; i<NUM_PARTICLES; i++) {
			var particle = particles[i];
			var zoom = 600/(50+particle.v.z);
			var px = (particle.v.x*zoom+CANVAS_OX);
			var py = (particle.v.y*zoom+CANVAS_OY);
			particle.v.px = px;
			particle.v.py = py;
		}

	}


	function loop() {
	
		if (mouseDown) {
			rotX = minmax((mouseY)*speedY, -0.05, 0.05);
			rotY = minmax((-mouseX)*speedX, -0.05, 0.05);
			rotZ = 0;
			rotMatrix.rot(rotX, rotY, rotZ)
			cnt+= 0.02;
		} else if (!mouseOver) {
			/*gV.x = Math.cos(cnt)*Math.sin(cnt)*30;
			gV.y = Math.cos(cnt)*Math.sin(cnt)*Math.sin(cnt)*30;
			gV.z = Math.cos(cnt)*Math.sin(cnt)*Math.cos(cnt)*30;
			cnt+= 0.02;*/
		}
		
		/* else {
			cnt += 0.1;
			rotX = Math.cos(cnt*0.1)*0.03;
			rotY = Math.sin(cnt*0.2)*0.03;
			rotZ = Math.cos(cnt*0.5)*0.03;
		}
		rotMatrix.rot(rotX, rotY, rotZ);*/

		//context.globalCompositeOperation = 'source-over';
		context.fillStyle = 'rgba(0,0,0,0.25)';
		context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		//context.globalCompositeOperation = 'lighter';
		//context.lineCap = 'round';

		/*for (var i=0; i<NUM_PARTICLES; i++) {
			var particle = particles[i];
			if (mouseDown) {
				rotMatrix.xParticle(particle);
				//particle.color.setAlpha(1);
			}
			else particle.move();
		}
		particles.sort(particleCompare);*/

		for (var i=0; i<NUM_PARTICLES; i++) {
			var particle = particles[i];

			if (mouseDown) {
				rotMatrix.xParticle(particle);
				//particle.color.setAlpha(1);
			}
			else particle.move();

			var zoom = 600/(50+particle.v.z);
			var px = (particle.v.x*zoom+CANVAS_OX);
			var py = (particle.v.y*zoom+CANVAS_OY);
			particle.v.px = px;
			particle.v.py = py;
			
			var lx = particle.v.px - particle.oldV.px;
			var ly = particle.v.py - particle.oldV.py;
			particle.length = Math.sqrt( lx*lx + ly*ly );
			//if (particle.length<0.5) particle.length=1;

			//var zcoef = (10-particle.v.z)/20;
			var size = 1;//minmax(zcoef*10, 1, 10);//20*zcoef;//particle.getSize();
			
			context.beginPath();
			if (particle.length<1) {
				context.fillStyle = particle.color.toString();
				context.arc(px, py, size/2, 0, PI2, true);
				context.fill();
			}
			else{
				context.strokeStyle = particle.color.toString();
				context.lineWidth = size;
				context.moveTo(particle.oldV.px, particle.oldV.py);
				context.lineTo(px, py);
				context.stroke();
			}
			context.closePath();
		}
	}

	function onMouseOver( event ) {
		mouseOver = true;
		gV.z = 0;
		cnt = 0;
	}

	function onMouseOut( event ) {
		mouseOver = false;
		mouseDown = false;
		gV.x = 0;
		gV.y = 0;
		gV.z = 0;
		cnt = 0;
	}

	function onMouseDown( event ) {
		mouseDown = true;
	}

	function onMouseUp( event ) {
		mouseDown = false;
	}

	function onMouseMove( event ) {
		mouseX = event.clientX - this.offsetLeft - CONTAINER_OX;
		mouseY = event.clientY - this.offsetTop - CONTAINER_OY;
		gV.x = mouseX/12;
		gV.y = mouseY/12;
	}

	function onTouchStart( event ) {
	}

	function onTouchMove( event ) {
	}
	
	function particleCompare(p1, p2) {
		return (p2.v.z - p1.v.z);
	}

})();