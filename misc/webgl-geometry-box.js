/*
 * A simple object to encapsulate the data and operations of object rasterization
 */
function WebGLGeometryBox(gl) {
	this.gl = gl;
	this.worldMatrix = new Matrix4();

    var position = new Float32Array([
      -1, -1, 
       1, -1, 
      -1,  1, 
      -1,  1,
       1, -1,
       1,  1,
        ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	// -----------------------------------------------------------------------------
	this.create = function(rawImage) {
        
        if (rawImage) {
            this.texture = this.gl.createTexture();
            this.gl.bindTexture(gl.TEXTURE_2D, this.texture);
            this.gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            this.gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            this.gl.texImage2D(
                this.gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
                this.gl.UNSIGNED_BYTE,
                rawImage
            );
            this.gl.bindTexture(gl.TEXTURE_2D, null);
        }
	}

	// -------------------------------------------------------------------------
}
this.render = function(camera, projectionMatrix, shaderProgram) {
        gl.useProgram(shaderProgram);

        var attributes = shaderProgram.attributes;
        var uniforms = shaderProgram.uniforms;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(
            attributes.vertexPositionAttribute,
            2,
            gl.FLOAT,
            gl.FALSE,
            0,
            0
        );
        gl.enableVertexAttribArray(attributes.vertexPositionAttribute);

        if (attributes.hasOwnProperty('vertexNormalsAttribute')) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
            gl.vertexAttribPointer(
                attributes.vertexNormalsAttribute,
                3,
                gl.FLOAT,
                gl.FALSE,
                0,
                0
            );
            gl.enableVertexAttribArray(attributes.vertexNormalsAttribute);
        }

        if (attributes.hasOwnProperty('vertexTexcoordsAttribute')) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
            gl.vertexAttribPointer(
                attributes.vertexTexcoordsAttribute,
                2,
                gl.FLOAT,
                gl.FALSE,
                0,
                0
            );
            gl.enableVertexAttribArray(attributes.vertexTexcoordsAttribute);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }

        // Send our matrices to the shader
        gl.uniformMatrix4fv(uniforms.worldMatrixUniform, false, this.worldMatrix.clone().transpose().elements);
        gl.uniformMatrix4fv(uniforms.viewMatrixUniform, false, camera.getViewMatrix().clone().transpose().elements);
        gl.uniformMatrix4fv(uniforms.projectionMatrixUniform, false, projectionMatrix.clone().transpose().elements);

        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

        this.texture && gl.bindTexture(gl.TEXTURE_2D, null);
        gl.disableVertexAttribArray(attributes.vertexPositionAttribute);
        attributes.vertexNormalsAttribute && gl.disableVertexAttribArray(attributes.vertexNormalsAttribute);
        attributes.vertexTexcoordsAttribute && gl.disableVertexAttribArray(attributes.vertexTexcoordsAttribute);
    }
}