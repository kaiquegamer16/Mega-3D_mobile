var container, stats, camera, scene, renderer;
var clock = new THREE.Clock();
var keyboard = new THREEx.KeyboardState();

var modelsToLoad = [
    { name: 'axis_pos_x.obj', color: 0xff0000, scale: { x: 1, y: 0.5, z: 0.5 } }, // Vermelho
    { name: 'axis_pos_y.obj', color: 0x00ff00, scale: { x: 0.5, y: 1, z: 0.5 } }, // Verde
    { name: 'axis_pos_z.obj', color: 0x0000ff, scale: { x: 0.5, y: 0.5, z: 1 } }  // Azul
];

var cube;
var axes;
var gridHelper;
var controls;
var currentModel = null;

init();
animate();

function init() {
    scene = new THREE.Scene();

    var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;
    var VIEW_ANGLE = 75, ASPECT = WIDTH / HEIGHT, NEAR = 0.1, FAR = 200000;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0, 0, 5);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(WIDTH, HEIGHT);
    document.body.appendChild(renderer.domElement);

    THREEx.WindowResize(renderer, camera);
    THREEx.FullScreen.bindKey({ charCode: 'm'.charCodeAt(0) });

    // Automatically enable full-screen mode on page load
    THREEx.FullScreen.request();

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    document.body.appendChild(stats.domElement);

    axes = new THREE.AxesHelper();
    axes.position.set(0, 0, 0);
    axes.scale.set(1, 1, 1);
    scene.add(axes);

    gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // Add lights
    var light1 = new THREE.PointLight(0xffffff, 1); // Intensidade padrão definida como 1
    light1.position.set(1, 1, 1);
    scene.add(light1);

    var light2 = new THREE.PointLight(0xffffff, 1); // Intensidade padrão definida como 1
    light2.position.set(-1, -1, -1);
    scene.add(light2);

    // Add skybox
    var skyGeometry = new THREE.BoxGeometry(200000, 200000, 200000);
    var skyMaterial = new THREE.MeshBasicMaterial({ color: 0x505050, side: THREE.BackSide });
    var skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skybox);

    // Add UI panel
    var panelContainer = document.createElement('div');
    panelContainer.className = 'panel-container';
    document.body.appendChild(panelContainer);

    var addButton = document.createElement('button');
    addButton.textContent = '+';
    addButton.style.backgroundColor = '#555';
    addButton.style.color = '#fff';
    addButton.style.border = 'none';
    addButton.style.padding = '5px 10px';
    addButton.style.borderRadius = '3px';
    addButton.onclick = toggleOptionsPanel;
    panelContainer.appendChild(addButton);

    var propertiesButton = document.createElement('button');
    propertiesButton.textContent = 'Propriedades';
    propertiesButton.style.backgroundColor = '#555';
    propertiesButton.style.color = '#fff';
    propertiesButton.style.border = 'none';
    propertiesButton.style.padding = '5px 10px';
    propertiesButton.style.borderRadius = '3px';
    propertiesButton.onclick = togglePropertiesPanel;
    panelContainer.appendChild(propertiesButton);

var transformButton = createButton('Transform', toggleTransformPanel);
panelContainer.appendChild(transformButton);

    var objectsButton = createButton('Objetos', toggleObjectsPanel);
panelContainer.appendChild(objectsButton);

var objectsPanel = document.createElement('div');
objectsPanel.className = 'panel-objects'; // Adicionando a classe 'panel-objects'
objectsPanel.innerHTML = '<h3>Lista de Objetos</h3>'; // Conteúdo do painel de objetos
document.body.appendChild(objectsPanel);

var importModelButton = document.createElement('button');
importModelButton.textContent = 'Importar Modelo';
importModelButton.style.backgroundColor = '#555';
importModelButton.style.color = '#fff';
importModelButton.style.border = 'none';
importModelButton.style.padding = '5px 10px';
importModelButton.style.borderRadius = '3px';
importModelButton.onclick = openImportPanel;
panelContainer.appendChild(importModelButton);
importModelButton.onclick = toggleImportPanel;

    var skyboxButton = document.createElement('button');
    skyboxButton.textContent = 'Skybox';
    skyboxButton.style.backgroundColor = '#555';
    skyboxButton.style.color = '#fff';
    skyboxButton.style.border = 'none';
    skyboxButton.style.padding = '5px 10px';
    skyboxButton.style.borderRadius = '3px';
    skyboxButton.onclick = toggleSkyboxPanel;
    panelContainer.appendChild(skyboxButton);

    var optionsPanel = document.createElement('div');
    optionsPanel.className = 'panel-options';
    optionsPanel.innerHTML = '<h3>Model Options</h3>' +
        '<button onclick="loadModel(\'sphere.obj\', 0.5, 1.0)">Sphere</button>' +
        '<button onclick="loadModel(\'cube.obj\', 0.5, 1.0)">Cube</button>' +
        '<button onclick="loadModel(\'torus.obj\', 0.5, 1.0)">Torus</button>' +
        '<button onclick="loadModel(\'capsule.obj\', 0.5, 1.0)">Capsule</button>';
    document.body.appendChild(optionsPanel);

    var propertiesPanel = document.createElement('div');
    propertiesPanel.className = 'panel-properties';
    propertiesPanel.innerHTML = '<label for="textureInput">Importar Textura:</label>' +
        '<input type="file" id="textureInput" onchange="applyTexture()">' +
        '<label for="albedoInput">Albedo:</label>' +
        '<input type="color" id="albedoInput" onchange="setAlbedo()">' +
        '<label for="normalInput">Normal Map:</label>' +
        '<input type="file" id="normalInput" onchange="applyNormalMap()">' +
        '<label for="roughnessInput">Roughness:</label>' +
        '<input type="number" id="roughnessInput" step="0.1" min="0" max="1" onchange="setRoughness()">' +
        '<label for="metalnessInput">Metalness:</label>' +
        '<input type="number" id="metalnessInput" step="0.1" min="0" max="1" onchange="setMetalness()">';
    document.body.appendChild(propertiesPanel);

var transformPanel = document.createElement('div');
transformPanel.className = 'panel-transform';
transformPanel.innerHTML = '<h3>Transform</h3>' +
    '<label for="positionXInput">Posição X:</label>' +
    '<input type="number" id="positionXInput" step="0.1" onchange="setPositionX()">' +
    '<label for="positionYInput">Posição Y:</label>' +
    '<input type="number" id="positionYInput" step="0.1" onchange="setPositionY()">' +
    '<label for="positionZInput">Posição Z:</label>' +
    '<input type="number" id="positionZInput" step="0.1" onchange="setPositionZ()">' +
    '<label for="rotationXInput">Rotação X:</label>' +
    '<input type="number" id="rotationXInput" step="1" min="-180" max="180" onchange="setRotationX()">' +
    '<label for="rotationYInput">Rotação Y:</label>' +
    '<input type="number" id="rotationYInput" step="1" min="-180" max="180" onchange="setRotationY()">' +
    '<label for="rotationZInput">Rotação Z:</label>' +
    '<input type="number" id="rotationZInput" step="1" min="-180" max="180" onchange="setRotationZ()">' +
    '<label for="scaleXInput">Escala X:</label>' +
    '<input type="number" id="scaleXInput" step="0.1" onchange="setScaleX()">' +
    '<label for="scaleYInput">Escala Y:</label>' +
    '<input type="number" id="scaleYInput" step="0.1" onchange="setScaleY()">' +
    '<label for="scaleZInput">Escala Z:</label>' +
    '<input type="number" id="scaleZInput" step="0.1" onchange="setScaleZ()">';
document.body.appendChild(transformPanel);

var importPanel = document.createElement('div');
importPanel.className = 'panel-import';
importPanel.innerHTML = '<h3>Importar Modelo</h3>' +
    '<input type="file" id="objFileInput" accept=".obj">' +
    '<button onclick="importOBJModel()">Importar .OBJ</button>' +
    '<input type="file" id="fbxFileInput" accept=".fbx">' +
    '<button onclick="importFBXModel()">Importar .FBX</button>';
document.body.appendChild(importPanel);

    var skyboxPanel = document.createElement('div');
    skyboxPanel.className = 'panel-skybox';
    skyboxPanel.innerHTML = '<label for="skyboxTextureInput">Importar Textura Skybox:</label>' +
        '<input type="file" id="skyboxTextureInput" onchange="applySkyboxTexture()">' +
        '<label for="skyboxRotationCheckbox">Rotacionar automaticamente:</label>' +
        '<input type="checkbox" id="skyboxRotationCheckbox" onchange="toggleSkyboxRotation()">' +
        '<label for="skyboxQualitySelect">Qualidade do Skybox:</label>' +
        '<select id="skyboxQualitySelect" onchange="changeSkyboxQuality()">' +
        '<option value="low">Baixa</option>' +
        '<option value="medium" selected>Média</option>' +
        '<option value="high">Alta</option>' +
        '</select>' +
        '<button onclick="removeSkyboxTexture()">Selecionar Nenhum</button>' +
        '<label for="lightIntensitySlider">Intensidade da Luz:</label>' +
        '<input type="range" id="lightIntensitySlider" min="0" max="2" step="0.1" value="1" onchange="changeLightIntensity()">';
    document.body.appendChild(skyboxPanel);
}

function animate() {
    requestAnimationFrame(animate);
    render();
    update();
}

function update() {
    var delta = clock.getDelta();
    var totalRunTime = clock.getElapsedTime();
    stats.update();
    controls.update();
}

function render() {
    renderer.render(scene, camera);
}

function toggleOptionsPanel() {
    var optionsPanel = document.querySelector('.panel-options');
    optionsPanel.style.display = (optionsPanel.style.display === 'none' || optionsPanel.style.display === '') ? 'block' : 'none';
}

function togglePropertiesPanel() {
    var propertiesPanel = document.querySelector('.panel-properties');
    propertiesPanel.style.display = (propertiesPanel.style.display === 'none' || propertiesPanel.style.display === '') ? 'block' : 'none';
}

function toggleSkyboxPanel() {
    var skyboxPanel = document.querySelector('.panel-skybox');
    skyboxPanel.style.display = (skyboxPanel.style.display === 'none' || skyboxPanel.style.display === '') ? 'block' : 'none';
}

// Função para carregar um modelo
function loadModel(modelName, roughness, metalness) {
    if (currentModel) {
        scene.remove(currentModel);
    }

    var loader = new THREE.OBJLoader();
    loader.load(
        modelName,
        function (object) {
            object.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    var material = new THREE.MeshStandardMaterial({
                        roughness: roughness,
                        metalness: metalness
                    });
                    child.material = material;
                }
            });
            scene.add(object);
            currentModel = object;
            updateObjectsPanel(); // Atualiza o painel de objetos
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.log('Error loading model', error);
        }
    );
}

function loadAdditionalModels(models) {
    models.forEach(function (model) {
        var loader = new THREE.OBJLoader();
        loader.load(
            model.name,
            function (object) {
                object.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        var material = new THREE.MeshStandardMaterial({
                            color: model.color
                        });
                        child.material = material;
                        child.scale.set(model.scale.x, model.scale.y, model.scale.z); // Adjust scale
                    }
                });
                scene.add(object);
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.log('Error loading model', error);
            }
        );
    });
}

function applyTexture() {
    var textureInput = document.getElementById('textureInput');
    var file = textureInput.files[0];

    if (file && currentModel) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var texture = new THREE.TextureLoader().load(e.target.result);
            currentModel.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material.map = texture;
                    child.material.needsUpdate = true;
                }
            });
        };
        reader.readAsDataURL(file);
    }
}

function setAlbedo() {
    var albedoInput = document.getElementById('albedoInput');
    var color = albedoInput.value;
    if (currentModel) {
        currentModel.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.color.set(color);
            }
        });
    }
}

function applyNormalMap() {
    var normalInput = document.getElementById('normalInput');
    var file = normalInput.files[0];

    if (file && currentModel) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var normalMap = new THREE.TextureLoader().load(e.target.result);
            currentModel.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material.normalMap = normalMap;
                    child.material.needsUpdate = true;
                }
            });
        };
        reader.readAsDataURL(file);
    }
}

function setRoughness() {
    var roughnessInput = document.getElementById('roughnessInput');
    var roughness = parseFloat(roughnessInput.value);
    if (currentModel) {
        currentModel.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.roughness = roughness;
                child.material.needsUpdate = true;
            }
        });
    }
}

function setMetalness() {
    var metalnessInput = document.getElementById('metalnessInput');
    var metalness = parseFloat(metalnessInput.value);
    if (currentModel) {
        currentModel.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.metalness = metalness;
                child.material.needsUpdate = true;
            }
        });
    }
}

function applySkyboxTexture() {
    var skyboxTextureInput = document.getElementById('skyboxTextureInput');
    var file = skyboxTextureInput.files[0];

    if (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var texture = new THREE.TextureLoader().load(e.target.result);
            scene.traverse(function (child) {
                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
                    child.material.map = texture;
                    child.material.needsUpdate = true;
                }
            });
        };
        reader.readAsDataURL(file);
    }
}

function toggleSkyboxRotation() {
    var skyboxRotationCheckbox = document.getElementById('skyboxRotationCheckbox');
    if (skyboxRotationCheckbox.checked) {
        // Enable skybox rotation
        // Implement skybox rotation logic here
        console.log('Skybox rotation enabled');
    } else {
        // Disable skybox rotation
        // Implement skybox rotation logic here
        console.log('Skybox rotation disabled');
    }
}

function changeSkyboxQuality() {
    var skyboxQualitySelect = document.getElementById('skyboxQualitySelect');
    var quality = skyboxQualitySelect.value;
    switch (quality) {
        case 'low':
            // Set low quality for skybox
            // Implement logic for low quality skybox here
            console.log('Skybox quality set to low');
            break;
        case 'medium':
            // Set medium quality for skybox
            // Implement logic for medium quality skybox here
            console.log('Skybox quality set to medium');
            break;
        case 'high':
            // Set high quality for skybox
            // Implement logic for high quality skybox here
            console.log('Skybox quality set to high');
            break;
        default:
            break;
    }
}

function removeSkyboxTexture() {
    scene.traverse(function (child) {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
            child.material.map = null;
            child.material.needsUpdate = true;
        }
    });
}

function changeLightIntensity() {
    var lightIntensitySlider = document.getElementById('lightIntensitySlider');
    var intensity = parseFloat(lightIntensitySlider.value);
    scene.traverse(function (child) {
        if (child instanceof THREE.PointLight) {
            child.intensity = intensity;
        }
    });
}

function openImportPanel() {
    var importPanel = document.querySelector('.panel-import');
    importPanel.style.display = 'block';
}

function toggleImportPanel() {
    var importPanel = document.querySelector('.panel-import');
    if (importPanel.style.display === 'none' || importPanel.style.display === '') {
        importPanel.style.display = 'block';
    } else {
        importPanel.style.display = 'none';
    }
}

// Variável para armazenar o modelo atualmente selecionado
var currentModel = null;

// Função para importar modelo .obj
function importOBJModel() {
    var objFileInput = document.getElementById('objFileInput');
    var file = objFileInput.files[0];

    if (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var loader = new THREE.OBJLoader();
            loader.load(
                e.target.result,
                function (object) {
                    scene.add(object); // Adiciona o modelo à cena
                    console.log('Modelo .obj importado com sucesso.');
                    currentModel = object; // Atualiza o modelo atualmente selecionado
                    object.userData.selected = false; // Marca o modelo como não selecionado

                    // Define o nome do modelo com base no nome do arquivo importado, se disponível
                    if (!object.name && file.name) {
                        object.name = file.name.split('.').slice(0, -1).join('.'); // Remove a extensão do arquivo
                    }

                    object.addEventListener('click', function () {
                        this.userData.selected = !this.userData.selected; // Alterna o estado de seleção do modelo
                    });
                    updateObjectsPanel(); // Atualiza o painel de objetos
                },
                function (xhr) {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
                function (error) {
                    console.log('Erro ao carregar modelo .obj', error);
                }
            );
        };
        reader.readAsDataURL(file);
    }
}

// Função para atualizar o painel de objetos com os nomes dos modelos carregados na cena
function updateObjectsPanel() {
    var objectsPanel = document.querySelector('.panel-objects');
    if (objectsPanel) {
        objectsPanel.innerHTML = '<h3>Objetos</h3>'; // Limpa o conteúdo do painel

        // Itera sobre todos os objetos na cena e adiciona seus nomes ao painel
        scene.traverse(function (child) {
            if (child instanceof THREE.Mesh && child.name) {
                var modelName = child.name;
                var objectItem = document.createElement('div');
                objectItem.textContent = modelName;
                objectsPanel.appendChild(objectItem);
            }
        });
    }
}

// Função para atualizar o painel de objetos com os nomes dos modelos carregados na cena
function updateObjectsPanel() {
    var objectsPanel = document.querySelector('.panel-objects');
    if (objectsPanel) {
        objectsPanel.innerHTML = '<h3>Objetos</h3>'; // Limpa o conteúdo do painel

        // Itera sobre todos os objetos na cena e adiciona seus nomes ao painel
        scene.traverse(function (child) {
            if (child instanceof THREE.Mesh && child.name) {
                var modelName = child.name;
                var objectItem = document.createElement('div');
                objectItem.textContent = modelName;
                objectsPanel.appendChild(objectItem);
            }
        });
    }
}

// Função para aplicar textura no modelo atualmente selecionado
function applyTexture() {
    var textureInput = document.getElementById('textureInput');
    var file = textureInput.files[0];

    if (file && currentModel) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var texture = new THREE.TextureLoader().load(e.target.result);
            currentModel.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material.map = texture;
                    child.material.needsUpdate = true;
                }
            });
        };
        reader.readAsDataURL(file);
    }
}

// Função para definir a cor albedo no modelo atualmente selecionado
function setAlbedo() {
    var albedoInput = document.getElementById('albedoInput');
    var color = albedoInput.value;
    if (currentModel) {
        currentModel.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.color.set(color);
            }
        });
    }
}

// Função para aplicar mapa de normal no modelo atualmente selecionado
function applyNormalMap() {
    var normalInput = document.getElementById('normalInput');
    var file = normalInput.files[0];

    if (file && currentModel) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var normalMap = new THREE.TextureLoader().load(e.target.result);
            currentModel.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material.normalMap = normalMap;
                    child.material.needsUpdate = true;
                }
            });
        };
        reader.readAsDataURL(file);
    }
}

// Função para definir a rugosidade no modelo atualmente selecionado
function setRoughness() {
    var roughnessInput = document.getElementById('roughnessInput');
    var roughness = parseFloat(roughnessInput.value);
    if (currentModel) {
        currentModel.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                // Verifica se o material do modelo é do tipo MeshStandardMaterial
                if (child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.roughness = roughness;
                    child.material.needsUpdate = true;
                } else {
                    console.warn('O material do modelo não é um MeshStandardMaterial. Criando um novo material...');
                    var newMaterial = new THREE.MeshStandardMaterial({ color: child.material.color });
                    newMaterial.roughness = roughness;
                    // Aplica o novo material ao modelo
                    child.material = newMaterial;
                }
            }
        });
    }
}

// Função para definir a metalicidade no modelo atualmente selecionado
function setMetalness() {
    var metalnessInput = document.getElementById('metalnessInput');
    var metalness = parseFloat(metalnessInput.value);
    if (currentModel) {
        currentModel.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                // Verifica se o material do modelo é do tipo MeshStandardMaterial
                if (child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.metalness = metalness;
                    child.material.needsUpdate = true;
                } else {
                    console.warn('O material do modelo não é um MeshStandardMaterial. Criando um novo material...');
                    var newMaterial = new THREE.MeshStandardMaterial({ color: child.material.color });
                    newMaterial.metalness = metalness;
                    // Aplica o novo material ao modelo
                    child.material = newMaterial;
                }
            }
        });
    }
}

// Função para importar modelo .fbx
function importFBXModel() {
    var fbxFileInput = document.getElementById('fbxFileInput');
    var file = fbxFileInput.files[0];

    if (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var loader = new THREE.FBXLoader();
            loader.load(
                e.target.result,
                function (object) {
                    scene.add(object); // Adiciona o modelo à cena
                    console.log('Modelo .fbx importado com sucesso.');
                },
                function (xhr) {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
                function (error) {
                    console.log('Erro ao carregar modelo .fbx', error);
                }
            );
        };
        reader.readAsDataURL(file);
    }
}

function createButton(text, onClick) {
    var button = document.createElement('button');
    button.textContent = text;
    button.style.backgroundColor = '#555';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.padding = '5px 10px';
    button.style.borderRadius = '3px';
    button.onclick = onClick;
    return button;
}

function toggleObjectsPanel() {
    var objectsPanel = document.querySelector('.panel-objects');
    objectsPanel.style.display = (objectsPanel.style.display === 'none' || objectsPanel.style.display === '') ? 'block' : 'none';
}

function toggleTransformPanel() {
    var transformPanel = document.querySelector('.panel-transform');
    transformPanel.style.display = (transformPanel.style.display === 'none' || transformPanel.style.display === '') ? 'block' : 'none';
}

function setPositionX() {
    var positionXInput = document.getElementById('positionXInput');
    var positionX = parseFloat(positionXInput.value);
    if (currentModel) {
        currentModel.position.x = positionX;
    }
}

function setPositionY() {
    var positionYInput = document.getElementById('positionYInput');
    var positionY = parseFloat(positionYInput.value);
    if (currentModel) {
        currentModel.position.y = positionY;
    }
}

function setPositionZ() {
    var positionZInput = document.getElementById('positionZInput');
    var positionZ = parseFloat(positionZInput.value);
    if (currentModel) {
        currentModel.position.z = positionZ;
    }
}

function setRotationX() {
    var rotationXInput = document.getElementById('rotationXInput');
    var rotationX = parseFloat(rotationXInput.value) * Math.PI / 180; // Convert degrees to radians
    if (currentModel) {
        currentModel.rotation.x = rotationX;
    }
}

function setRotationY() {
    var rotationYInput = document.getElementById('rotationYInput');
    var rotationY = parseFloat(rotationYInput.value) * Math.PI / 180; // Convert degrees to radians
    if (currentModel) {
        currentModel.rotation.y = rotationY;
    }
}

function setRotationZ() {
    var rotationZInput = document.getElementById('rotationZInput');
    var rotationZ = parseFloat(rotationZInput.value) * Math.PI / 180; // Convert degrees to radians
    if (currentModel) {
        currentModel.rotation.z = rotationZ;
    }
}

function setScaleX() {
    var scaleXInput = document.getElementById('scaleXInput');
    var scaleX = parseFloat(scaleXInput.value);
    if (currentModel) {
        currentModel.scale.x = scaleX;
    }
}

function setScaleY() {
    var scaleYInput = document.getElementById('scaleYInput');
    var scaleY = parseFloat(scaleYInput.value);
    if (currentModel) {
        currentModel.scale.y = scaleY;
    }
}

function setScaleZ() {
    var scaleZInput = document.getElementById('scaleZInput');
    var scaleZ = parseFloat(scaleZInput.value);
    if (currentModel) {
        currentModel.scale.z = scaleZ;
    }
}