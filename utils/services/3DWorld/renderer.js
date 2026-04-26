export class Mesh {
    constructor(vertices, faces = []) {
        this.vertices = vertices;
        this.faces = faces;
    }

    addFace(faceIndices) {
        this.faces.push(faceIndices);
    }
}

export class Light {
    constructor(x = 5, y = 8, z = -8) {
        this.position  = { x, y, z };
        this.intensity = 1.0;   // diffuse multiplier (0–1)
        this.ambient   = 0.15;  // minimum brightness even in shadow (0–1)
    }
}

export class Camera {
    constructor(x = 0, y = 0, z = 1) {
        this.position = { x, y, z };
        this.rotation = { pitch: 0, yaw: 0, roll: 0 };  //in degrees
    }

    //Move the camera forward in the direction it's currently facing
    moveForward(distance) {
        const radYaw = this.rotation.yaw * Math.PI / 180;
        this.position.x += Math.sin(radYaw) * distance;
        this.position.z += Math.cos(radYaw) * distance;
    }

    //style left/right perpendicular to the direction the camera is facing
    strafeRight(distance) {
        const radYaw = this.rotation.yaw * Math.PI / 180;
        this.position.x += Math.cos(radYaw) * distance;
        this.position.z -= Math.sin(radYaw) * distance;
    }

    // Move camera up/down    
    moveVertical(distance) {
        this.position.y += distance;
    }
}

export class Renderer {

    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.focalLength = options.focalLength || 4000; // Distance from camera to projection plane
        this.camera = new Camera(0,0,0);
        this.options = options;
    }

    //Set camera position and rotation
    setCamera(x, y, z, pitch = 0, yaw = 0, roll = 0) {
        this.camera.position = { x, y, z };
        this.camera.rotation = { pitch, yaw, roll };
    }

    //translate a 3d point from world to camera space
    worldToCamera(x, y, z) {
        let camX = x - this.camera.position.x;
        let camY = y - this.camera.position.y;
        let camZ = z - this.camera.position.z;

        const pitchRad = this.camera.rotation.pitch * Math.PI / 180;
        const yawRad   = this.camera.rotation.yaw   * Math.PI / 180;
        const rollRad  = this.camera.rotation.roll  * Math.PI / 180;

        const cosPitch = Math.cos(pitchRad), sinPitch = Math.sin(pitchRad);
        const cosYaw   = Math.cos(yawRad),   sinYaw   = Math.sin(yawRad);
        const cosRoll  = Math.cos(rollRad),  sinRoll  = Math.sin(rollRad);

        // View matrix: rows are the camera's right, up, and forward basis vectors
        // expressed in world space (inverse = transpose of the camera orientation matrix).
        // Yaw rotates around world Y, pitch tilts around the local X (right) axis.
        //   right   = ( cosYaw,             0,       -sinYaw           )
        //   up      = ( sinYaw*sinPitch,  cosPitch,   cosYaw*sinPitch   )
        //   forward = ( sinYaw*cosPitch, -sinPitch,   cosYaw*cosPitch   )
        const vx = camX * cosYaw                               - camZ * sinYaw;
        const vy = camX * sinYaw * sinPitch + camY * cosPitch  + camZ * cosYaw * sinPitch;
        const vz = camX * sinYaw * cosPitch - camY * sinPitch  + camZ * cosYaw * cosPitch;

        // Apply roll around the view Z axis
        const newX =  vx * cosRoll - vy * sinRoll;
        const newY =  vx * sinRoll + vy * cosRoll;
        const newZ =  vz;

        return { x: newX, y: newY, z: newZ };
    } 
    
    //convert 3D world coordinates to 2D screen coordinates
    project3DTo2D(x, y, z) {
        //skip points behind the camera
        if (z <= 0) return null;

        const screenX = this.centerX + (x * this.focalLength) / z;
        const screenY = this.centerY - (y * this.focalLength) / z; //invert y for screen coordinates
        return { x: screenX, y: screenY };
    }

    //Clear the canvas
    clear() {
        this.ctx.fillStyle = this.options.backgroundColor || 'black';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }   

    // ---- Vector helpers ----
    _cross(a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x
        };
    }

    _normalize(v) {
        const len = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
        if (len === 0) return { x: 0, y: 0, z: 1 };
        return { x: v.x/len, y: v.y/len, z: v.z/len };
    }

    _dot(a, b) {
        return a.x*b.x + a.y*b.y + a.z*b.z;
    }

    // Clip a polygon (in camera space) against the near plane z=near.
    // Returns an array of camera-space vertices that are in front of the plane.
    _clipFaceToNearPlane(camVerts, near = 0.1) {
        const output = [];
        const n = camVerts.length;
        for (let i = 0; i < n; i++) {
            const curr = camVerts[i];
            const next = camVerts[(i + 1) % n];
            const currIn = curr.z >= near;
            const nextIn = next.z >= near;
            if (currIn) output.push(curr);
            if (currIn !== nextIn) {
                const t = (near - curr.z) / (next.z - curr.z);
                output.push({
                    x: curr.x + t * (next.x - curr.x),
                    y: curr.y + t * (next.y - curr.y),
                    z: near
                });
            }
        }
        return output;
    }

    // Parse '#4af' or '#44aaff' and scale by brightness (0–1)
    _shadeColor(hex, brightness) {
        let r, g, b;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }
        return `rgb(${Math.round(r*brightness)},${Math.round(g*brightness)},${Math.round(b*brightness)})`;
    }

    //Render an object or array of objects with flat shading, back-face culling, and depth sorting
    render(objectGraph, clear = true, color = null, light = null) {
        if (clear) this.clear();

        const objects     = Array.isArray(objectGraph) ? objectGraph : [objectGraph];
        const baseColor   = color || this.options.objectColor || '#ffffff';
        const activeLight = light || this.options.light || null;

        objects.forEach(obj => {
            const objCenter = this.getObjectCenter(obj);

            // Depth-sort faces farthest-first (painter's algorithm)
            const sortedFaces = obj.faces.map(face => {
                let totalZ = 0;
                face.forEach(vi => {
                    const cam = this.worldToCamera(obj.vertices[vi].x, obj.vertices[vi].y, obj.vertices[vi].z);
                    totalZ += cam.z;
                });
                return { face, avgZ: totalZ / face.length };
            }).sort((a, b) => b.avgZ - a.avgZ);

            sortedFaces.forEach(({ face }) => {
                const v0 = obj.vertices[face[0]];
                const v1 = obj.vertices[face[1]];
                const v2 = obj.vertices[face[2]];

                const faceCenter = {
                    x: (v0.x + v1.x + v2.x) / 3,
                    y: (v0.y + v1.y + v2.y) / 3,
                    z: (v0.z + v1.z + v2.z) / 3
                };

                // Compute raw face normal via cross product
                const edge1 = { x: v1.x-v0.x, y: v1.y-v0.y, z: v1.z-v0.z };
                const edge2 = { x: v2.x-v0.x, y: v2.y-v0.y, z: v2.z-v0.z };
                let normal  = this._normalize(this._cross(edge1, edge2));

                // For convex meshes: outward direction = object center → face center.
                // Flip normal if it points inward — works regardless of winding order.
                const outward = {
                    x: faceCenter.x - objCenter.x,
                    y: faceCenter.y - objCenter.y,
                    z: faceCenter.z - objCenter.z
                };
                if (this._dot(normal, outward) < 0) {
                    normal = { x: -normal.x, y: -normal.y, z: -normal.z };
                }

                // Back-face culling: skip if outward normal faces away from camera
                const viewDir = {
                    x: this.camera.position.x - faceCenter.x,
                    y: this.camera.position.y - faceCenter.y,
                    z: this.camera.position.z - faceCenter.z
                };
                if (this._dot(normal, viewDir) <= 0) return;

                // Flat shading
                let brightness = 1.0;
                if (activeLight) {
                    const lightDir = this._normalize({
                        x: activeLight.position.x - faceCenter.x,
                        y: activeLight.position.y - faceCenter.y,
                        z: activeLight.position.z - faceCenter.z
                    });
                    const diffuse = Math.max(0, this._dot(normal, lightDir));
                    brightness = activeLight.ambient + (1.0 - activeLight.ambient) * diffuse * activeLight.intensity;
                }

                // Transform face vertices to camera space
                const camVerts = face.map(vi => {
                    const v = obj.vertices[vi];
                    return this.worldToCamera(v.x, v.y, v.z);
                });

                // Clip against near plane so straddling faces are partially drawn
                const clipped = this._clipFaceToNearPlane(camVerts);
                if (clipped.length < 3) return;

                // Project clipped vertices to 2D
                const projectedPoints = clipped.map(cv => this.project3DTo2D(cv.x, cv.y, cv.z));
                if (projectedPoints.some(p => p === null)) return;

                if (projectedPoints.length >= 3) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(projectedPoints[0].x, projectedPoints[0].y);
                    for (let i = 1; i < projectedPoints.length; i++) {
                        this.ctx.lineTo(projectedPoints[i].x, projectedPoints[i].y);
                    }
                    this.ctx.closePath();
                    this.ctx.fillStyle = this._shadeColor(baseColor, brightness);
                    this.ctx.fill();
                }
            });
        });
    }

    rotate(obj, dx = 0, dy = 0, dz = 0) {
        const radX = dx * Math.PI / 180;
        const radY = dy * Math.PI / 180;
        const radZ = dz * Math.PI / 180;

        //find the center of the object
        const center =  this.getObjectCenter(obj);

        const cosX = Math.cos(radX), sinX = Math.sin(radX);
        const cosY = Math.cos(radY), sinY = Math.sin(radY);
        const cosZ = Math.cos(radZ), sinZ = Math.sin(radZ); 

        const rotatedVertices = obj.vertices.map(({x,y,z}) => {
            //translate to origin
            const localX = x - center.x;
            const localY = y - center.y;
            const localZ = z - center.z;    

            //Apply combined rotation matrix
            const rotX = localX * (cosY * cosZ) + 
                         localY * (sinX * sinY * cosZ - cosX * sinZ) + 
                         localZ * (cosX * sinY * cosZ + sinX * sinZ); 
            const rotY = localX * (cosY * sinZ) +
                         localY * (sinX * sinY * sinZ + cosX * cosZ) +
                         localZ * (cosX * sinY * sinZ - sinX * cosZ);
            const rotZ = localX * (-sinY) +
                         localY * (sinX * cosY) +
                         localZ * (cosX * cosY);
            
            //Translate back (add center back)
            return {
                x: rotX + center.x,
                y: rotY + center.y,
                z: rotZ + center.z
            };

        });

        return { vertices: rotatedVertices, faces: obj.faces };
    }

    getObjectCenter(obj) {
        const sum = obj.vertices.reduce((acc, vertex) => {
            acc.x += vertex.x;
            acc.y += vertex.y;
            acc.z += vertex.z;
            return acc;
        }, { x: 0, y: 0, z: 0 });   

        const count = obj.vertices.length;
        return {
            x: sum.x / count,
            y: sum.y / count,       
            z: sum.z / count
        };
    }
}
        