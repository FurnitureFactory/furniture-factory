import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const INTERDESK = {
  FRAME_INSET_CM: 8,
  FOOT_BASE_CM: 60,
  FOOT_BASE_DUAL_CM: 70,
  BEAM_H_CM: 4.2,
  BEAM_D_CM: 6.5,
  LEG_UPPER_H_CM: 40,
  LEG_LOWER_H_CM: 36,
  LEG_UPPER_W_CM: 5.2,
  LEG_LOWER_W_CM: 7.4,
  LEG_FOOT_H_CM: 2.8,
  LEG_FOOT_D_CM: 3.5,
  MOTOR_W_CM: 8.5,
  MOTOR_H_CM: 3.2,
  LEG_INSET: 0.12,
  DESK_HEIGHT_CM: 95,
};

const FRAME = {
  Black: { color: 0x2c2c26, metalness: 0.9, roughness: 0.28 },
  White: { color: 0xfaf9f6, metalness: 0.05, roughness: 0.82 },
};

const WOOD = {
  Oak: { color: 0xc39a66, edge: 0xa37e4c },
  "Light Brown": { color: 0xa3744a, edge: 0x876038 },
  Walnut: { color: 0x4c3221, edge: 0x372114 },
  Olive: { color: 0x525b32, edge: 0x3f4727 },
};

function parseCm(id) {
  return parseInt(String(id).replace("cm", ""), 10) || 140;
}

function parseMm(id) {
  return parseInt(String(id).replace("mm", ""), 10) || 25;
}

function woodTex(color, edgeColor, alongLength) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext("2d");
  const base = new THREE.Color(color);
  const edge = new THREE.Color(edgeColor);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#" + edge.clone().offsetHSL(0, 0, -0.03).getHexString());
  g.addColorStop(0.22, "#" + base.getHexString());
  g.addColorStop(0.78, "#" + base.clone().offsetHSL(0, 0, 0.05).getHexString());
  g.addColorStop(1, "#" + edge.getHexString());
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 256);
  ctx.globalAlpha = 0.22;
  for (let x = 0; x < 1024; x += 5 + Math.random() * 7) {
    ctx.strokeStyle = "rgba(32,22,10," + (0.05 + Math.random() * 0.1) + ")";
    ctx.lineWidth = 0.8 + Math.random() * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 18, 64, x - 12, 192, x + 8, 256);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(alongLength ? 3.6 : 1.2, alongLength ? 1 : 2.4);
  if (alongLength) tex.rotation = Math.PI / 2;
  tex.anisotropy = 4;
  return tex;
}

function metalMat(frameColour) {
  const f = FRAME[frameColour] || FRAME.Black;
  const isWhite = frameColour === "White";
  return new THREE.MeshStandardMaterial({
    color: f.color,
    metalness: isWhite ? f.metalness : f.metalness * 0.82,
    roughness: isWhite ? f.roughness : Math.min(0.58, f.roughness + 0.12),
  });
}

function woodMat(color, edgeColor, lengthCm, isPlywood) {
  const tex = woodTex(color, edgeColor, true);
  return {
    tex,
    mat: new THREE.MeshStandardMaterial({
      map: tex,
      roughness: isPlywood ? 0.68 : 0.58,
      metalness: 0.02,
      color: 0xffffff,
    }),
    edge: new THREE.MeshStandardMaterial({
      color: edgeColor,
      roughness: 0.62,
      metalness: 0.01,
    }),
  };
}

export class DeskPreview3D {
  constructor(container, options) {
    this.container = container;
    this.onViewChange = options?.onViewChange || null;
    this._disposed = false;
    this.viewMode = "front";
    this._deskH = INTERDESK.DESK_HEIGHT_CM;
    this._views = { front: null, top: null, side: null };
    this._viewEmitT = 0;
    this._contentOffsetRatio = 0;
    this._contentOffsetX = 0;
    this._lastSpan = 140;
    this._baseLift = 48;

    const w = Math.max(container.clientWidth, 280);
    const h = Math.max(container.clientHeight, 240);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.5, 600);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = this.renderer.domElement;
    canvas.style.display = "block";
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "none";
    container.appendChild(canvas);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.rotateSpeed = 0.85;
    this.controls.minPolarAngle = 0.04;
    this.controls.maxPolarAngle = Math.PI - 0.04;
    this.controls.minDistance = 80;
    this.controls.maxDistance = 280;
    this.controls.target.set(0, 48, 0);

    this.controls.addEventListener("start", () => {
      this.viewMode = "orbit";
    });
    this.controls.addEventListener("change", () => this._scheduleViewEmit());
    this.controls.addEventListener("end", () => this._emitView());

    const hemi = new THREE.HemisphereLight(0xfff8ef, 0xe8dfd0, 0.55);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff6ea, 1.05);
    key.position.set(55, 95, 48);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 20;
    key.shadow.camera.far = 320;
    const s = 110;
    key.shadow.camera.left = -s;
    key.shadow.camera.right = s;
    key.shadow.camera.top = s;
    key.shadow.camera.bottom = -s;
    key.shadow.bias = -0.0002;
    key.shadow.radius = 3;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0xffffff, 0.42);
    rim.position.set(-40, 60, -55);
    this.scene.add(rim);

    const fill = new THREE.DirectionalLight(0xf0ebe2, 0.28);
    fill.position.set(-25, 28, 70);
    this.scene.add(fill);

    const shadowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(1, 64),
      new THREE.MeshBasicMaterial({ color: 0x2a2218, transparent: true, opacity: 0.1 })
    );
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.08;
    this._shadowDisc = shadowDisc;
    this.scene.add(shadowDisc);

    this.desk = new THREE.Group();
    this.scene.add(this.desk);

    this._woodTex = null;

    this._resizeObs = new ResizeObserver(() => this.resize());
    this._resizeObs.observe(container);

    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
    requestAnimationFrame(() => this.resize());
  }

  _fitViews(lengthCm, breadthCm, deskH) {
    const span = Math.max(lengthCm, breadthCm, deskH);
    this._lastSpan = span;
    const dist = span * 2.15;
    const lift = deskH * 0.48;
    const tgt = [0, lift, 0];
    this._views = {
      front: { pos: [0, lift + span * 0.14, dist], target: tgt.slice() },
      top: { pos: [0, dist * 1.05, 0.01], target: tgt.slice() },
      side: { pos: [dist, lift + span * 0.14, 0], target: tgt.slice() },
    };
    this.controls.minDistance = span * 1.05;
    this.controls.maxDistance = span * 3.1;
    this._baseLift = lift;
    this._applyContentOffset();
  }

  setContentOffset(ratio) {
    const span = this._lastSpan || 140;
    this._contentOffsetRatio = Math.max(0, Math.min(ratio || 0, 0.35));
    this._contentOffsetX = this._contentOffsetRatio * span * 0.95;
    this._applyContentOffset();
  }

  _applyContentOffset() {
    const ox = this._contentOffsetX || 0;
    const lift = this._baseLift ?? this._deskH * 0.48;
    this.desk.position.x = ox;
    this.controls.target.set(ox, lift, 0);
    if (this._views.front) {
      Object.keys(this._views).forEach((mode) => {
        this._views[mode].target[0] = ox;
      });
    }
    if (this.viewMode && this.viewMode !== "orbit") this.setView(this.viewMode);
    this.controls.update();
  }

  _detectView() {
    const o = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    const r = o.length();
    if (r < 0.01) return "front";
    const polar = Math.acos(THREE.MathUtils.clamp(o.y / r, -1, 1));
    if (polar < 0.52) return "top";
    const az = Math.atan2(o.x, o.z);
    let deg = THREE.MathUtils.radToDeg(az);
    deg = ((deg % 360) + 360) % 360;
    if ((deg > 48 && deg < 132) || (deg > 228 && deg < 312)) return "side";
    return "front";
  }

  _scheduleViewEmit() {
    this._viewEmitT = performance.now();
  }

  _emitView() {
    const v = this._detectView();
    if (v !== this.viewMode) {
      this.viewMode = v;
      this.onViewChange?.(v);
    }
  }

  resize() {
    if (this._disposed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  _tick() {
    if (this._disposed) return;
    if (this._viewEmitT && performance.now() - this._viewEmitT < 120) {
      this._emitView();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._tick);
  }

  setView(mode) {
    const v = this._views[mode] || this._views.front;
    if (!v) return;
    this.viewMode = mode;
    this.camera.position.set(v.pos[0], v.pos[1], v.pos[2]);
    this.controls.target.set(v.target[0], v.target[1], v.target[2]);
    this.controls.update();
    this.onViewChange?.(mode);
  }

  _clearGroup(g) {
    while (g.children.length) {
      const o = g.children[0];
      g.remove(o);
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    }
  }

  _box(w, h, d, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  updateFromSel(sel) {
    if (!sel) return;

    const lengthCm = parseCm(sel.length);
    const breadthCm = parseCm(sel.breadth);
    const thickMm = parseMm(sel.thickness);
    const thickCm = thickMm / 10;
    const isDual = sel.motor === "Dual Motor";
    const wood = WOOD[sel.topColour] || WOOD.Oak;
    const isPlywood = sel.material === "Plywood";

    if (this._woodTex) this._woodTex.dispose();
    const { tex, mat: topMat, edge: edgeMat } = woodMat(wood.color, wood.edge, lengthCm, isPlywood);
    this._woodTex = tex;
    const frameMat = metalMat(sel.frameColour);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85, metalness: 0.05 });

    this._clearGroup(this.desk);

    const deskH = INTERDESK.DESK_HEIGHT_CM;
    const footH = INTERDESK.LEG_FOOT_H_CM;
    const upperH = INTERDESK.LEG_UPPER_H_CM;
    const lowerH = Math.max(8, deskH - thickCm - INTERDESK.BEAM_H_CM - upperH - footH);

    const frameLen = Math.max(lengthCm - INTERDESK.FRAME_INSET_CM * 2, lengthCm * 0.86);
    const footW = Math.min(
      isDual && lengthCm >= 140 ? INTERDESK.FOOT_BASE_DUAL_CM : INTERDESK.FOOT_BASE_CM,
      breadthCm * 0.97
    );
    const inset = lengthCm * INTERDESK.LEG_INSET;
    const legX = lengthCm / 2 - inset;

    const top = this._box(lengthCm, thickCm, breadthCm, topMat);
    top.position.y = deskH - thickCm / 2;
    this.desk.add(top);

    if (sel.edge === "Curve etched") {
      top.geometry.dispose();
      top.geometry = new THREE.BoxGeometry(lengthCm, thickCm, breadthCm, 2, 1, 10);
    }

    const edgeH = Math.max(0.12, thickCm * 0.34);
    const edgeD = 0.22;
    const frontEdge = this._box(lengthCm - 0.4, edgeH, edgeD, edgeMat);
    frontEdge.position.set(0, deskH - edgeH / 2 - 0.02, breadthCm / 2 - edgeD / 2 + 0.02);
    this.desk.add(frontEdge);
    [-1, 1].forEach((side) => {
      const sideEdge = this._box(edgeD, edgeH, breadthCm - 0.5, edgeMat);
      sideEdge.position.set(side * (lengthCm / 2 - edgeD / 2 + 0.02), deskH - edgeH / 2 - 0.02, 0);
      this.desk.add(sideEdge);
    });

    const beam = this._box(frameLen, INTERDESK.BEAM_H_CM, INTERDESK.BEAM_D_CM, frameMat);
    beam.position.y = deskH - thickCm - INTERDESK.BEAM_H_CM / 2;
    this.desk.add(beam);

    [-1, 1].forEach((side) => {
      const x = side * legX;
      const upper = this._box(INTERDESK.LEG_UPPER_W_CM, upperH, INTERDESK.LEG_UPPER_W_CM, frameMat);
      upper.position.set(x, footH + lowerH + upperH / 2, 0);
      this.desk.add(upper);

      const lower = this._box(INTERDESK.LEG_LOWER_W_CM, lowerH, INTERDESK.LEG_LOWER_W_CM, frameMat);
      lower.position.set(x, footH + lowerH / 2, 0);
      this.desk.add(lower);

      const foot = this._box(INTERDESK.LEG_FOOT_D_CM, footH, footW, frameMat);
      foot.position.set(x, footH / 2, 0);
      this.desk.add(foot);
    });

    const motorY = deskH - thickCm - INTERDESK.BEAM_H_CM - INTERDESK.MOTOR_H_CM / 2 - 0.6;
    if (isDual) {
      [-1, 1].forEach((side) => {
        const motor = this._box(INTERDESK.MOTOR_W_CM, INTERDESK.MOTOR_H_CM, 4.6, frameMat);
        motor.position.set(side * frameLen * 0.32, motorY, 0);
        this.desk.add(motor);
        const pad = this._box(2.2, 0.55, 1.4, padMat);
        pad.position.set(side * frameLen * 0.32, motorY - INTERDESK.MOTOR_H_CM / 2 - 0.35, 2.6);
        this.desk.add(pad);
      });
    } else {
      const motor = this._box(frameLen * 0.4, INTERDESK.MOTOR_H_CM, 4.6, frameMat);
      motor.position.set(0, motorY, 0);
      this.desk.add(motor);
      const pad = this._box(3.2, 0.55, 1.4, padMat);
      pad.position.set(0, motorY - INTERDESK.MOTOR_H_CM / 2 - 0.35, 2.6);
      this.desk.add(pad);
    }

    this._shadowDisc.scale.set(lengthCm * 0.28, breadthCm * 0.32, 1);

    this._deskH = deskH;
    this._fitViews(lengthCm, breadthCm, deskH);
    const tgt = this._views.front.target;
    this.controls.target.set(tgt[0], tgt[1], tgt[2]);
  }

  dispose() {
    this._disposed = true;
    this._resizeObs.disconnect();
    this.controls.dispose();
    this._clearGroup(this.desk);
    if (this._woodTex) this._woodTex.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

window.DeskPreview3D = DeskPreview3D;
window.dispatchEvent(new Event("desk3d-ready"));
