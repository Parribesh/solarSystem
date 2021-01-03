precision mediump float;

uniform vec4 uColor;
uniform samplerCube skybox;

varying vec3 vTexcoords;

void main(void) {
    gl_FragColor = textureCube(skybox, vTexcoords);
}
