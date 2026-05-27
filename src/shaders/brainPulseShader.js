export const brainPulseVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const brainPulseFragment = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  uniform vec3 uHighlightCenter;
  uniform float uHighlightStrength;
  uniform vec3 uBaseColor;
  uniform vec3 uGlowColor;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 n = normalize(vNormal);
    float fresnel = pow(1.0 - max(dot(n, vec3(0.0, 0.0, 1.0)), 0.0), 2.8);

    float wave1 = sin(vWorldPosition.y * 14.0 + uTime * 1.1) * 0.5 + 0.5;
    float wave2 = sin(vWorldPosition.z * 16.0 - uTime * 0.95) * 0.5 + 0.5;
    float flow = wave1 * 0.55 + wave2 * 0.45;

    float dist = distance(vWorldPosition, uHighlightCenter);
    float highlight = exp(-dist * dist * 3.2) * uHighlightStrength;

    float pulse = flow * uPulse * 0.35 + highlight * 0.45;
    vec3 color = mix(uBaseColor, uGlowColor, pulse + fresnel * 0.25);
    float alpha = 0.05 + fresnel * 0.14 + pulse * 0.12;

    gl_FragColor = vec4(color, alpha);
  }
`
