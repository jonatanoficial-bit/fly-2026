const GameModule = (function () {
  let renderer, scene, camera, plane;
  let running = false;
  let keys = {};
  let speed = 0.35; // velocidade base
  let yaw = 0, pitch = 0, roll = 0;

  function getFlightById(id) {
    return window.flightData.flights.find(f => f.id === id);
  }

  function startFlight(flightId) {
    const f = getFlightById(flightId);
    if (!f) return;

    // Mostrar overlay
    const view = document.getElementById("flightView");
    view.classList.remove("hidden");

    document.getElementById("flightTitle").textContent =
      `${f.flightNumber} — ${f.origin.code} → ${f.destination.code}`;

    // Setup 3D
    initThree();
    bindControls();

    // Botão sair
    document.getElementById("btnExitFlight").onclick = stopFlight;

    running = true;
    animate();
  }

  function initThree() {
    const canvas = document.getElementById("flightCanvas");

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    resize();

    // Cena
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050a12, 50, 700);

    // Câmera
    camera = new THREE.PerspectiveCamera(65, canvas.clientWidth / canvas.clientHeight, 0.1, 2000);

    // Luzes
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(50, 120, 40);
    scene.add(dir);

    // Céu simples
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(1200, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x061a33, side: THREE.BackSide })
    );
    scene.add(sky);

    // Chão
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000, 40, 40),
      new THREE.MeshStandardMaterial({ color: 0x0b2a1a, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    scene.add(ground);

    // Avião (placeholder — depois você troca por GLTF)
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0xddddff, metalness: 0.2, roughness: 0.6 })
    );
    body.rotation.z = Math.PI / 2;

    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 6, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xbad6ff, metalness: 0.1, roughness: 0.6 })
    );
    wing.rotation.x = Math.PI / 2;

    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 1.8, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xbad6ff, metalness: 0.1, roughness: 0.6 })
    );
    tail.position.x = -2.6;
    tail.rotation.x = Math.PI / 2;

    plane = new THREE.Group();
    plane.add(body);
    plane.add(wing);
    plane.add(tail);
    plane.position.set(0, 30, 0);
    scene.add(plane);

    // Reset controles
    yaw = 0; pitch = 0; roll = 0;
    speed = 0.35;

    window.addEventListener("resize", resize);
  }

  function resize() {
    const canvas = document.getElementById("flightCanvas");
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (!renderer || !camera || w === 0 || h === 0) return;

    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function bindControls() {
    keys = {};

    window.onkeydown = (e) => { keys[e.key.toLowerCase()] = true; };
    window.onkeyup = (e) => { keys[e.key.toLowerCase()] = false; };

    // Setas também (mobile teclado/bt)
    window.addEventListener("keydown", (e) => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
    }, { passive: false });
  }

  function update() {
    // Pitch (setas)
    if (keys["arrowup"]) pitch += 0.012;
    if (keys["arrowdown"]) pitch -= 0.012;

    // Yaw (A/D)
    if (keys["a"]) yaw += 0.012;
    if (keys["d"]) yaw -= 0.012;

    // Roll (Q/E)
    if (keys["q"]) roll += 0.012;
    if (keys["e"]) roll -= 0.012;

    // Speed (W/S)
    if (keys["w"]) speed = Math.min(speed + 0.01, 2.5);
    if (keys["s"]) speed = Math.max(speed - 0.01, 0.05);

    // Aplicar rotação suave
    plane.rotation.x = pitch;
    plane.rotation.y = yaw;
    plane.rotation.z = roll;

    // Mover “para frente” no eixo Z negativo do avião
    const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(plane.quaternion);
    plane.position.addScaledVector(forward, speed);

    // Câmera follow
    const camOffset = new THREE.Vector3(-18, 8, 0).applyQuaternion(plane.quaternion);
    camera.position.copy(plane.position).add(camOffset);
    camera.lookAt(plane.position);

    // Limites simples (não cair infinito)
    plane.position.y = Math.max(plane.position.y, 5);
    plane.position.y = Math.min(plane.position.y, 250);
  }

  function animate() {
    if (!running) return;

    update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function stopFlight() {
    running = false;

    // Esconde overlay
    document.getElementById("flightView").classList.add("hidden");
    document.getElementById("flightHelp").classList.add("hidden");

    // Limpa handlers
    window.onkeydown = null;
    window.onkeyup = null;

    // Limpa cena/renderer
    try {
      if (renderer) renderer.dispose();
    } catch (_) {}

    renderer = null;
    scene = null;
    camera = null;
    plane = null;
  }

  return {
    startFlight,
    stopFlight
  };
})();