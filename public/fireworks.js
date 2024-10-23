// File: public/fireworks.js
class Firework {
    constructor(x, y, color) {
        this.position = { x, y };
        this.particles = [];
        this.color = color;
        this.isDead = false;
        this.createParticles();
    }

    createParticles() {
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x: this.position.x,
                y: this.position.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0
            });
        }
    }

    update() {
        let allDead = true;
        this.particles.forEach(particle => {
            if (particle.life > 0) {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.05; // gravity
                particle.life -= 0.01;
                allDead = false;
            }
        });
        this.isDead = allDead;
    }
}

class FireworksRenderer {
    constructor() {
        this.canvas = document.getElementById('fireworks');
        this.gl = this.canvas.getContext('webgl');
        this.fireworks = [];
        this.lastFireworkTime = 0;
        this.fireworkInterval = 500;
        
        this.initGL();
        this.resize();
        this.setupEventListeners();
        this.animate();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        // Add click interaction
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.createFireworkAt(x, y);
        });

        // Add touch support for mobile
        this.canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = event.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.createFireworkAt(x, y);
        });
    }

    initGL() {
        const gl = this.gl;
        
        // Create shaders
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        // Create program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        gl.useProgram(this.program);

        // Create buffer
        const positions = new Float32Array([0, 0]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        // Set attributes and uniforms
        const positionLocation = gl.getAttribLocation(this.program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        this.resolutionLocation = gl.getUniformLocation(this.program, 'resolution');
        this.sizeLocation = gl.getUniformLocation(this.program, 'size');
        this.colorLocation = gl.getUniformLocation(this.program, 'color');
        this.positionLocation = gl.getUniformLocation(this.program, 'particlePosition');

        // Enable blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
    }

    getRandomColor() {
        const colors = [
            [1, 0.3, 0.3, 1],  // Red
            [0.3, 1, 0.3, 1],  // Green
            [0.3, 0.3, 1, 1],  // Blue
            [1, 1, 0.3, 1],    // Yellow
            [1, 0.3, 1, 1],    // Pink
            [0.3, 1, 1, 1]     // Cyan
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createFireworkAt(x, y) {
        const color = this.getRandomColor();
        this.fireworks.push(new Firework(x, y, color));
    }

    createRandomFireworks() {
        // Create multiple fireworks across the entire screen
        const numFireworks = 3;
        for (let i = 0; i < numFireworks; i++) {
            // Random position across the entire canvas
            const x = Math.random() * this.canvas.width;
            
            // Use full screen height (leaving small margins at top and bottom)
            const y = Math.random() * (this.canvas.height * 0.8) + (this.canvas.height * 0.1);
            
            const color = this.getRandomColor();
            this.fireworks.push(new Firework(x, y, color));
        }
    }

    createInitialFireworks() {
        // Create more fireworks spread across the screen
        const numInitialFireworks = 8;
        for (let i = 0; i < numInitialFireworks; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * (this.canvas.height * 0.8) + (this.canvas.height * 0.1);
            const color = this.getRandomColor();
            this.fireworks.push(new Firework(x, y, color));
        }
    }

    render() {
        const gl = this.gl;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.fireworks = this.fireworks.filter(firework => !firework.isDead);
        
        this.fireworks.forEach(firework => {
            firework.particles.forEach(particle => {
                if (particle.life <= 0) return;

                gl.uniform2f(this.positionLocation, particle.x, particle.y);
                gl.uniform1f(this.sizeLocation, 4);
                gl.uniform4f(
                    this.colorLocation,
                    firework.color[0],
                    firework.color[1],
                    firework.color[2],
                    particle.life
                );
                gl.drawArrays(gl.POINTS, 0, 1);
            });
        });
    }

    animate() {
        const currentTime = Date.now();
        
        // Create initial fireworks if this is the first frame
        if (this.fireworks.length === 0) {
            this.createInitialFireworks();
            this.lastFireworkTime = currentTime;
        }
        
        if (currentTime - this.lastFireworkTime > this.fireworkInterval) {
            this.createRandomFireworks();
            this.lastFireworkTime = currentTime;
        }

        this.fireworks.forEach(firework => firework.update());
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize the renderer when the page loads
window.addEventListener('load', () => {
    new FireworksRenderer();
});