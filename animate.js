// Import libraries
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/OrbitControls.js'
import rhino3dm from 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/rhino3dm.module.js'
import { RhinoCompute } from 'https://cdn.jsdelivr.net/npm/compute-rhino3d@0.13.0-beta/compute.rhino3d.module.js'
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/loaders/3DMLoader.js'


const definitionName = 'CLOTH_6'

// Set up sliders
const PINCH_RADIUS_slider = document.getElementById('PINCH_RADIUS')
PINCH_RADIUS_slider.addEventListener('mouseup', onSliderChange, false)
PINCH_RADIUS_slider.addEventListener('touchend', onSliderChange, false)

const FALLOFF_slider = document.getElementById('FALLOFF')
FALLOFF_slider.addEventListener('mouseup', onSliderChange, false)
FALLOFF_slider.addEventListener('touchend', onSliderChange, false)

const MIN_SCALE_slider = document.getElementById('MIN_SCALE')
MIN_SCALE_slider.addEventListener('mouseup', onSliderChange, false)
MIN_SCALE_slider.addEventListener('touchend', onSliderChange, false)

const MAX_SCALE_slider = document.getElementById('MAX_SCALE')
MAX_SCALE_slider.addEventListener('mouseup', onSliderChange, false)
MAX_SCALE_slider.addEventListener('touchend', onSliderChange, false)

const SMOOTHNESS_1_slider = document.getElementById('SMOOTHNESS_1')
SMOOTHNESS_1_slider.addEventListener('mouseup', onSliderChange, false)
SMOOTHNESS_1_slider.addEventListener('touchend', onSliderChange, false)

const SMOOTHNESS_2_slider = document.getElementById('SMOOTHNESS_2')
SMOOTHNESS_2_slider.addEventListener('mouseup', onSliderChange, false)
SMOOTHNESS_2_slider.addEventListener('touchend', onSliderChange, false)




const loader = new Rhino3dmLoader()
loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/')

let rhino, definition, doc
rhino3dm().then(async m => {
    console.log('Loaded rhino3dm.')
    rhino = m // global

    //RhinoCompute.url = getAuth( 'RHINO_COMPUTE_URL' ) // RhinoCompute server url. Use http://localhost:8081 if debugging locally.
    //RhinoCompute.apiKey = getAuth( 'RHINO_COMPUTE_KEY' )  // RhinoCompute server api key. Leave blank if debugging locally.
    RhinoCompute.url = 'http://localhost:8081/' //if debugging locally.
    // load a grasshopper file!
    const url = definitionName
    const res = await fetch(url)
    const buffer = await res.arrayBuffer()
    const arr = new Uint8Array(buffer)
    definition = arr

    init()
    compute()
})

async function compute() {


    const param1 = new RhinoCompute.Grasshopper.DataTree('PINCH_RADIUS')
    param1.append([0], [PINCH_RADIUS_slider.valueAsNumber])

    const param2 = new RhinoCompute.Grasshopper.DataTree('FALLOFF')
    param2.append([0], [FALLOFF_slider.valueAsNumber])

    const param3 = new RhinoCompute.Grasshopper.DataTree('MIN_SCALE')
    param3.append([0], [MIN_SCALE_slider.valueAsNumber])
   
    const param4 = new RhinoCompute.Grasshopper.DataTree('MAX_SCALE')
    param4.append([0], [MAX_SCALE_slider.valueAsNumber])

    const param5 = new RhinoCompute.Grasshopper.DataTree('SMOOTHNESS_1')
    param5.append([0], [SMOOTHNESS_1_slider.valueAsNumber])

    const param6 = new RhinoCompute.Grasshopper.DataTree('SMOOTHNESS_2')
    param6.append([0], [SMOOTHNESS_2_slider.valueAsNumber])

    

    // clear values
    const trees = []
    trees.push(param1)
    trees.push(param2)
    trees.push(param3)
    trees.push(param4)
    trees.push(param5)
    trees.push(param6)


    const res = await RhinoCompute.Grasshopper.evaluateDefinition(definition, trees)

    console.log(res)

    doc = new rhino.File3dm()

    // hide spinner
    document.getElementById('loader').style.display = 'none'

    for (let i = 0; i < res.values.length; i++) {

        for (const [key, value] of Object.entries(res.values[i].InnerTree)) {
            for (const d of value) {

                const data = JSON.parse(d.data)
                const rhinoObject = rhino.CommonObject.decode(data)
                doc.objects().add(rhinoObject, null)

            }
        }
    }


    // clear objects from scene
    scene.traverse(child => {
        if (!child.isLight) {
            scene.remove(child)
        }
    })


    const buffer = new Uint8Array(doc.toByteArray()).buffer
    loader.parse(buffer, function (object) {

        scene.add(object)
        // hide spinner
        document.getElementById('loader').style.display = 'none'

    })
}


function onSliderChange() {
    // show spinner
    document.getElementById('loader').style.display = 'block'
    compute()
}




// BOILERPLATE //

let scene, camera, renderer, controls

function init() {

    // create a scene and a camera
    scene = new THREE.Scene()
    scene.background = new THREE.Color(1, 1, 1)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = - 30

    // create the renderer and add it to the html
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    // add some controls to orbit the camera
    controls = new OrbitControls(camera, renderer.domElement)

    // add a directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff)
    directionalLight.intensity = 2
    scene.add(directionalLight)

    const ambientLight = new THREE.AmbientLight()
    scene.add(ambientLight)

    animate()
}

function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    animate()
}

function meshToThreejs(mesh, material) {
    const loader = new THREE.BufferGeometryLoader()
    const geometry = loader.parse(mesh.toThreejsJSON())
    return new THREE.Mesh(geometry, material)
}
    // load materials and cube maps
    let material

    // load a pbr material
    //const tl = new THREE.TextureLoader()
    //tl.setPath('materials/PBR/streaked-metal1/')
   // material = new THREE.MeshPhysicalMaterial()
   // material.map          = tl.load('streaked-metal1_base.png')
   // material.aoMmap       = tl.load('streaked-metal1_ao.png')
   // material.normalMap    = tl.load('streaked-metal1_normal.png')
   // material.metalnessMap = tl.load('streaked-metal1_metallic.png')
   // material.metalness = 0.0
   // material.roughness = 0.0

    // or create a material
     //material = new THREE.MeshStandardMaterial( {
         //color: 0xffffff,
         //metalness: 1.0,
         //roughness: 0.0,
        

         
     //} )
