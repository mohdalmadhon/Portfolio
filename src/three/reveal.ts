import * as THREE from 'three'

export interface RevealUniforms {
  uRevealCenter: { value: THREE.Vector2 }
  uRevealRadius: { value: number }
  uRevealSoft: { value: number }
  uRevealPixel: { value: number }
  uRevealGlow: { value: THREE.Color }
  uTime: { value: number }
}

export function createRevealUniforms(): RevealUniforms {
  return {
    uRevealCenter: { value: new THREE.Vector2(-9999, -9999) },
    uRevealRadius: { value: 0 },
    uRevealSoft: { value: 10 },
    uRevealPixel: { value: 3 },
    uRevealGlow: { value: new THREE.Color('#5ff2e4') },
    uTime: { value: 0 },
  }
}

const header = /* glsl */ `
uniform vec2 uRevealCenter;
uniform float uRevealRadius;
uniform float uRevealSoft;
uniform float uRevealPixel;
uniform vec3 uRevealGlow;
uniform float uTime;
float revealHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
`

export type RevealMode = 'skin' | 'skeleton'

export function applyReveal<T extends THREE.Material>(material: T, mode: RevealMode, uniforms: RevealUniforms): T {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\n${header}`)
    const test = mode === 'skin'
      ? `if (revealOn > 0.5 && revealEdge < revealNoise) discard;`
      : `if (revealOn < 0.5 || revealEdge >= revealNoise) discard;`
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
      float revealDist = distance(gl_FragCoord.xy, uRevealCenter);
      float revealOn = step(0.5, uRevealRadius);
      float revealEdge = smoothstep(uRevealRadius - uRevealSoft, uRevealRadius + uRevealSoft, revealDist);
      float revealNoise = mix(0.08, 0.92, revealHash(floor(gl_FragCoord.xy / uRevealPixel)));
      ${test}`,
    )
    const glow = mode === 'skin'
      ? `float revealRing = revealOn * (1.0 - smoothstep(0.0, uRevealSoft * 1.6, abs(revealDist - uRevealRadius - uRevealSoft * 0.4)));
         totalEmissiveRadiance += uRevealGlow * revealRing * 0.9;`
      : `float revealRim = revealOn * smoothstep(uRevealRadius * 0.55, uRevealRadius + uRevealSoft, revealDist);
         totalEmissiveRadiance += uRevealGlow * revealRim * 0.35 + vec3(0.06, 0.09, 0.1) * revealOn;`
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>\n${glow}`,
    )
  }
  material.customProgramCacheKey = () => `reveal-${mode}`
  return material
}
