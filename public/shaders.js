const vertexShaderSource = `
    attribute vec2 position;
    uniform vec2 resolution;
    uniform float size;
    uniform vec2 particlePosition;
    
    void main() {
        vec2 pos = (particlePosition + position) / resolution * 2.0 - 1.0;
        gl_Position = vec4(pos * vec2(1, -1), 0, 1);
        gl_PointSize = size;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 color;
    
    void main() {
        vec2 coord = gl_PointCoord * 2.0 - 1.0;
        float r = length(coord);
        float alpha = 1.0 - smoothstep(0.8, 1.0, r);
        gl_FragColor = color * alpha;
    }
`;