// Particle class to manage individual particles
class Particle {
    constructor(x, y, type) {
        this.position = [x, y];
        this.velocity = [0, 0];
        this.color = [1, 1, 1, 1];
        this.size = 3.0;
        this.life = 1.0;
        this.initialLife = 1.0;
        this.type = type;
    }
}

// Main WebGL Fireworks class
class WebGLFireworks {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl');
        if (!this.gl) {
            alert('Unable to initialize WebGL. Your browser may not support it.');
            return;
        }

        this.particles = [];
        this.maxParticles = 50000;

        // Initialize shaders and buffers
        this.initShaders();
        this.initBuffers();

        // Set up viewport and events
        this.resize();
        this.initEvents();
        window.addEventListener('resize', () => this.resize());

        // Start animation
        this.lastTime = 0;
        this.fireworkTimer = 0;
        this.animate();

        // Simulate random clicks
        this.simulateRandomClicks();
    }

    initEvents() {
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height * 2 - 1);

            this.generateFirework(x, y, 'burst');
            this.generateFirework(x, y, 'trail');
        });
    }

    // Function to simulate random clicks
    simulateRandomClicks() {
        setInterval(() => {
            const x = this.random(-1, 1);
            const y = this.random(-1, 1);
            this.generateFirework(x, y, 'burst');
            this.generateFirework(x, y, 'trail');
        }, 400); // Adjust the interval time as needed (1000ms = 1 second)
    }

    initEvents() {
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height * 2 - 1);
            
            this.generateFirework(x, y, 'burst');
            this.generateFirework(x, y, 'trail');
        });
    }

    // Initialize WebGL shaders
    initShaders() {
        // Vertex shader source
        const vsSource = `
            attribute vec2 aVertexPosition;
            attribute vec4 aColor;
            attribute float aSize;
            
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            
            varying vec4 vColor;
            
            void main() {
                gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 0.0, 1.0);
                gl_PointSize = aSize;
                vColor = aColor;
            }
        `;

        // Fragment shader source
        const fsSource = `
            precision mediump float;
            varying vec4 vColor;
            
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) {
                    discard;
                }
                gl_FragColor = vColor;
            }
        `;

        // Create and compile shaders
        const vertexShader = this.compileShader(vsSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fsSource, this.gl.FRAGMENT_SHADER);

        // Create shader program
        this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this.shaderProgram, vertexShader);
        this.gl.attachShader(this.shaderProgram, fragmentShader);
        this.gl.linkProgram(this.shaderProgram);

        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(this.shaderProgram));
            return;
        }

        // Get attribute and uniform locations
        this.programInfo = {
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition'),
                color: this.gl.getAttribLocation(this.shaderProgram, 'aColor'),
                size: this.gl.getAttribLocation(this.shaderProgram, 'aSize'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
            },
        };
    }

    // [Rest of the methods remain the same as in your code]
    initBuffers() {
        this.positionBuffer = this.gl.createBuffer();
        this.colorBuffer = this.gl.createBuffer();
        this.sizeBuffer = this.gl.createBuffer();
    }

    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    generateFirework(x, y, type) {
        const numParticles = type === 'trail' ? 10 : 150;
        const baseColor = [
            this.random(1.0, 1.0),   // Strong red for golden effect
            this.random(0.8, 1.0),   // High green for yellowish
            this.random(0.1, 0.3),   // Low blue to keep it warm
            //1.0                      // Full opacity
        ];
    
        for (let i = 0; i < numParticles; i++) {
            if (this.particles.length >= this.maxParticles) break;
    
            const particle = new Particle(x, y, type);
            
            if (type === 'trail') {
                particle.velocity = [
                    this.random(-0.005, 0.005),  // Slower trail
                    this.random(0.05, 0.05)
                ];
                particle.color = [1.0, 0.6, 0.2, 1.0];  // Yellowish-golden color
                particle.size = 2.0;
                particle.life = this.random(0.4, 0.6);
            } else {
                const angle = (Math.PI * 2 * i) / numParticles;
                const speed = this.random(0.05, 0.05);  // Slower burst
                particle.velocity = [
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                ];
                particle.color = [...baseColor];  // Apply golden color
                particle.size = this.random(2.0, 4.0);
                particle.life = this.random(0.8, 1.2);
            }
            
            particle.initialLife = particle.life;
            this.particles.push(particle);
        }
    }
    

    update(deltaTime) {
        this.particles = this.particles.filter(particle => {
            if (particle.life <= 0) return false;

            particle.position[0] += particle.velocity[0];
            particle.position[1] += particle.velocity[1];

            const gravity = particle.type === 'trail' ? -0.8 : -0.3;
            particle.velocity[1] += gravity * deltaTime;
            particle.velocity[0] += this.random(-0.01, 0.01) * deltaTime;

            particle.life -= deltaTime;
            particle.color[3] = particle.life / particle.initialLife;

            return true;
        });
    }

    render() {
        this.gl.clearColor(0.0, 0.0, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.gl.useProgram(this.shaderProgram);

        const projectionMatrix = mat4.create();
        const modelViewMatrix = mat4.create();
        
        mat4.ortho(projectionMatrix, -1, 1, -1, 1, -1, 1);
        
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix
        );
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        );

        const positions = [];
        const colors = [];
        const sizes = [];

        this.particles.forEach(particle => {
            positions.push(...particle.position);
            colors.push(...particle.color);
            sizes.push(particle.size);
        });

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            2,
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.color,
            4,
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.color);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sizeBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(sizes), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.size,
            1,
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.size);

        this.gl.drawArrays(this.gl.POINTS, 0, this.particles.length);
    }

    animate(currentTime = 0) {
        const deltaTime = (currentTime - this.lastTime) / 1000.0;
        this.lastTime = currentTime;

        this.fireworkTimer += deltaTime;
        if (this.fireworkTimer >= 0.8) {
            const startX = this.random(-0.8, 0.8);
            this.generateFirework(startX, -0.8, 'burst');
            this.generateFirework(startX, -0.8, 'trail');
            this.fireworkTimer = 0;
        }

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.animate(time));
    }
}

// Initialize when the window loads
window.onload = () => {
    const canvas = document.getElementById('glCanvas');
    new WebGLFireworks(canvas);
};