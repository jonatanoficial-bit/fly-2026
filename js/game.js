/**
 * Módulo responsável pelo simulador 3D usando three.js.  Criamos uma cena
 * simples com um avião representado por geometria básica (pode ser
 * substituído por um modelo GLTF via GLTFLoader no futuro【945860909363583†L206-L214】).
 * A câmera segue o avião em terceira pessoa.  Os controles permitem ao
 * usuário inclinar e virar a aeronave com as setas do teclado ou WASD.
 */

const GameModule = (function () {
    let scene, camera, renderer;
    let planeMesh;
    let animationId;
    let flightData;
    let speed = 0.5;
    let pitch = 0;
    let yaw = 0;
    let roll = 0;
    let keys = {};

    /**
     * Inicializa a cena 3D quando necessário.  Cria câmera, luzes e o avião.
     */
    function init() {
        const container = document.getElementById('threeContainer');
        container.innerHTML = '';
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb); // céu azul

        camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 5, 10);

        // Luz ambiente e direcional
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // Plano de chão
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        scene.add(ground);

        // Cria avião como um grupo de formas básicas
        planeMesh = createSimplePlane();
        scene.add(planeMesh);

        // Eventos de teclado
        window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
        window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

        // Ajusta tamanho do renderer ao redimensionar janela
        window.addEventListener('resize', onWindowResize);
    }

    /**
     * Cria uma representação simplificada de um avião usando
     * geometria básica.  Isso pode ser substituído por uma
     * importação de modelo GLTF quando disponível【945860909363583†L206-L214】.
     */
    function createSimplePlane() {
        const group = new THREE.Group();

        // Fuselagem
        const fuselageGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 12);
        const fuselageMat = new THREE.MeshPhongMaterial({ color: 0xdddddd });
        const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
        fuselage.rotation.z = Math.PI / 2;
        group.add(fuselage);

        // Asas
        const wingGeo = new THREE.BoxGeometry(4, 0.1, 1);
        const wingMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
        const wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.set(0, 0, 0);
        group.add(wing);

        // Cauda vertical
        const tailGeo = new THREE.BoxGeometry(0.1, 0.8, 0.4);
        const tailMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const tail = new THREE.Mesh(tailGeo, tailMat);
        tail.position.set(-2, 0.4, 0);
        group.add(tail);

        group.scale.set(1, 1, 1);
        return group;
    }

    /**
     * Inicia o voo para um voo específico, posicionando o avião
     * na coordenada de origem e exibindo o simulador.
     * @param {Object} flight Objeto de voo contendo posição inicial
     */
    function startFlight(flight) {
        // se ainda não inicializado, faz a inicialização
        if (!renderer) init();
        // define dados do voo atual
        flightData = flight;
        // posiciona o avião na origem
        planeMesh.position.set(0, 0, 0);
        planeMesh.rotation.set(0, 0, 0);
        pitch = yaw = roll = 0;
        speed = 0.2;
        // mostra container 3D e oculta mapa
        document.getElementById('threeContainer').style.display = 'block';
        document.getElementById('map').style.display = 'none';
        // inicia loop de animação
        animate();
    }

    /**
     * Loop de animação que atualiza a posição do avião e da câmera.
     */
    function animate() {
        animationId = requestAnimationFrame(animate);

        // Processa controles
        if (keys['arrowup'] || keys['w']) pitch += 0.01;
        if (keys['arrowdown'] || keys['s']) pitch -= 0.01;
        if (keys['arrowleft'] || keys['a']) yaw += 0.01;
        if (keys['arrowright'] || keys['d']) yaw -= 0.01;
        if (keys['q']) roll += 0.01;
        if (keys['e']) roll -= 0.01;
        if (keys['+'] || keys['=']) speed += 0.01;
        if (keys['-'] || keys['_']) speed = Math.max(0.05, speed - 0.01);

        // Aplica rotações
        planeMesh.rotation.x = pitch;
        planeMesh.rotation.y = yaw;
        planeMesh.rotation.z = roll;

        // Calcula vetor de direção (eixo x positivo do cilindro)
        const forward = new THREE.Vector3(1, 0, 0);
        forward.applyQuaternion(planeMesh.quaternion);
        planeMesh.position.add(forward.multiplyScalar(speed));

        // Move câmera atrás do avião
        const cameraOffset = new THREE.Vector3(-8, 4, 0);
        cameraOffset.applyQuaternion(planeMesh.quaternion);
        camera.position.copy(planeMesh.position.clone().add(cameraOffset));
        camera.lookAt(planeMesh.position);

        renderer.render(scene, camera);
    }

    /**
     * Ajusta o tamanho do renderizador quando a janela ou o container muda.
     */
    function onWindowResize() {
        if (!renderer || !camera) return;
        const container = document.getElementById('threeContainer');
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    /**
     * Termina o modo de voo e volta para o mapa.
     */
    function endFlight() {
        cancelAnimationFrame(animationId);
        document.getElementById('threeContainer').style.display = 'none';
        document.getElementById('map').style.display = 'block';
    }

    return {
        startFlight,
        endFlight
    };
})();