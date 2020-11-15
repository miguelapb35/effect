const width = innerWidth;
const height = innerHeight;

const renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

// WebGL background color
renderer.setClearColor("#000", 1);
var matShader;
// Setup a camera
const camera = new THREE.PerspectiveCamera(50, width / height, 1, 50);
camera.position.set(0, -1.5, -0.75);
camera.lookAt(new THREE.Vector3());
const controls = new THREE.OrbitControls(camera, renderer.domElement);
// Setup your scene
const scene = new THREE.Scene();

const texture = new THREE.TextureLoader().load(
  "https://assets.codepen.io/1600187/JDK.jpg"
);

// Setup a geometry
const geometry = new THREE.PlaneBufferGeometry(1, 1, 120, 120);

const mat = new THREE.MeshPhongMaterial({
  map: texture,
  side: THREE.DoubleSide,
  shininess: 69
});

mat.onBeforeCompile = (shader) => {
  shader.uniforms.time = { value: -4 };
  shader.vertexShader =
    `
        uniform float time;

        // Pulled the main geometry calculation into a function so we can easily apply it
        // when calculating vectors to adjacent vertices
        float zed(float x, float y) {
          float scale = -0.25;
          float sigma = 0.6;
          float dxdx = pow(x, 2.0);
          float dydy = pow(y, 2.0);
          float freq = dxdx * 15.0 + dydy * 15.0;
          float mu = ((-time) * 1.75) * 1.5 + freq;
          return scale * (1.0 / (sigma * sqrt(2.0 * 3.14159)) ) * pow(2.718, -0.5 * pow(mu, 2.0) / sigma);

          // Swap in other functions to see normal map works generically
          // return 0.25*scale*cos(mu);
        }
    ` + shader.vertexShader;

  const token = "#include <begin_vertex>";

  // vertex shader info using https://en.wikipedia.org/wiki/Gaussian_function to map curve.
  const customTransform = `
        vec3 transformed = vec3(position);
        float amp = 0.4;
        float dx = position.x;
        float dy = position.y;
        
        // Scale and inversion moved to zed function so that later calculations use the same 
        transformed.z += zed(dx, dy);

        // Create grid of neighbor points & solve for the average normal vector.
        // Essentially creating 4 sets of tangent & bitangent vector pair, 
        //     ==> https://apoorvaj.io/exploring-bump-mapping-with-webgl/#normal-mapping
        // Averaging out the calc in 4 directions gives better results than just using one.
        
        vec3 v = transformed;
        float voffset = 1.0/1120.0;
        
        vec3 a = v + vec3(voffset, 0, 0);
        float az = zed(a.x, a.y);
        a = (vec3(a.x, a.y, az));
        vec3 va = a - v;
        
        vec3 b = v + vec3(0, voffset, 0);
        float bz = zed(b.x, b.y);
        b = (vec3(b.x, b.y, bz));
        vec3 vb = b - v;
        
        vec3 c = v + vec3(-voffset, 0, 0);
        float cz = zed(c.x, c.y);
        c = (vec3(c.x, c.y, cz));
        vec3 vc = c - v;
        
        vec3 d = v + vec3(0, -voffset, 0);
        float dz = zed(d.x, d.y);
        d = (vec3(d.x, d.y, dz));
        vec3 vd = d - v;
        
        // Find the normal vector for each vertex pair
        vec3 vab_norm = cross(va, vb);
        // vec3 vbc_norm = cross(vb, vc);
        // vec3 vcd_norm = cross(vc, vd);
        // vec3 vda_norm = cross(vd, va);

        // Find the average normal - probably overkill, but the math is good, haha
        vec3 v_norm = vec3(vab_norm.xyz);

        objectNormal = normalize(vab_norm);
        vNormal = normalMatrix*objectNormal;
    `;
  shader.vertexShader = shader.vertexShader.replace(token, customTransform);
  matShader = shader;
};
const light = new THREE.PointLight(0xcccccc, 1);
light.position.set(0, -20, -60);
scene.add(light);

const light1 = new THREE.PointLight(0xaaaaaa, 1);
light1.position.set(0, -14, 69);
scene.add(light1);

const alight = new THREE.AmbientLight(0x333333); // soft white light
scene.add(alight);

// Setup a mesh with geometry + material
const mesh = new THREE.Mesh(geometry, mat);
scene.add(mesh);

const t = { val: -4 };

function render() {
  if (matShader) matShader.uniforms.time.value = t.val;
  renderer.setPixelRatio(2);
  renderer.render(scene, camera);
}

gsap.ticker.add(render);

gsap.to(t, {
  ease: "power1.out",
  // ease: "none",
  val: 4.5,
  repeat: -1,
  duration: 8,
  yoyo: false
  // onUpdate: render
});
