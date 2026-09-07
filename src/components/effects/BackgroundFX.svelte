<!--
  BackgroundFX.svelte
  ------------------------------------------------------------------------
  Provides a soft "aurora" background + a canvas star/particle field that
  reacts gently to the mouse. This component is mounted once in Layout.astro
  so it survives swup page navigation.

  - Visible only when `siteConfig.effects.dynamicBackground.enable` is true.
  - Does not block pointer events.
  - On touch / reduced-motion devices we keep things static.
-->
<script lang="ts">
import { onMount } from "svelte";
import { siteConfig } from "../../config";

	type Props = {
		colors?: readonly string[];
		particleDensity?: number;
	};

	const {
		colors = siteConfig.effects.dynamicBackground.colors ?? [
			"#a78bfa",
			"#60a5fa",
			"#f472b6",
			"#34d399",
		],
		particleDensity = siteConfig.effects.dynamicBackground.particleDensity ?? 0.6,
	}: Props = $props();

	const enabled = siteConfig.effects.dynamicBackground.enable;

	// Reactive references used by the canvas + css layers
	let canvasEl: HTMLCanvasElement | null = $state(null);
	let rootEl: HTMLDivElement | null = $state(null);
	let isTouch = $state(false);
	let reducedMotion = $state(false);

	// mouse position (smoothed for the glow)
	let mouseX = $state(0);
	let mouseY = $state(0);
	let glowX = $state(0);
	let glowY = $state(0);

	onMount(() => {
		isTouch =
			window.matchMedia?.("(hover: none) and (pointer: coarse)").matches ?? false;
		reducedMotion =
			window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

		if (!enabled || !canvasEl || !rootEl) return;

		const canvas = canvasEl;
		const ctx = canvas.getContext("2d", { alpha: true });
		if (!ctx) return;

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		let w = 0;
		let h = 0;
		let raf = 0;

		type Particle = {
			x: number;
			y: number;
			vx: number;
			vy: number;
			r: number;
			a: number;
			phase: number;
			speed: number;
		};

		let particles: Particle[] = [];
		const particleCountFromArea = (area: number) =>
			Math.max(24, Math.min(140, Math.floor(area / 14000 * particleDensity)));

		function resize() {
			if (!canvas || !rootEl) return;
			const rect = rootEl.getBoundingClientRect();
			w = rect.width;
			h = rect.height;
			canvas.width = Math.floor(w * dpr);
			canvas.height = Math.floor(h * dpr);
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			ctx?.scale(dpr, dpr);
			rebuildParticles();
		}

		function rebuildParticles() {
			const target = particleCountFromArea(w * h);
			particles = Array.from({ length: target }, () => makeParticle());
		}

		function makeParticle(): Particle {
			const angle = Math.random() * Math.PI * 2;
			const r = 0.3 + Math.random() * 1.4;
			const speed = 0.08 + Math.random() * 0.18;
			return {
				x: Math.random() * w,
				y: Math.random() * h,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				r,
				a: 0.25 + Math.random() * 0.55,
				phase: Math.random() * Math.PI * 2,
				speed: 0.4 + Math.random() * 0.8,
			};
		}

		function step(t: number) {
			raf = requestAnimationFrame(step);
			if (!ctx) return;
			ctx.clearRect(0, 0, w, h);

			// Smooth the mouse-driven glow
			glowX += (mouseX - glowX) * 0.08;
			glowY += (mouseY - glowY) * 0.08;

			for (const p of particles) {
				// gentle drift; if reduced motion, freeze drift but keep twinkle
				if (!reducedMotion) {
					p.x += p.vx;
					p.y += p.vy;
					if (p.x < -20) p.x = w + 20;
					else if (p.x > w + 20) p.x = -20;
					if (p.y < -20) p.y = h + 20;
					else if (p.y > h + 20) p.y = -20;
				}

				// parallax: pushes particles slightly away from mouse
				if (!isTouch) {
					const dx = p.x - glowX;
					const dy = p.y - glowY;
					const d2 = dx * dx + dy * dy;
					const radius = 140;
					if (d2 < radius * radius && d2 > 1) {
						const d = Math.sqrt(d2);
						const force = (1 - d / radius) * 0.6;
						p.x += (dx / d) * force;
						p.y += (dy / d) * force;
					}
				}

				const tw = 0.5 + 0.5 * Math.sin(t * 0.001 * p.speed + p.phase);
				const alpha = p.a * (0.35 + 0.65 * tw);
				ctx.beginPath();
				ctx.fillStyle = `rgba(220, 220, 240, ${alpha.toFixed(3)})`;
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
				ctx.fill();
			}

			// Draw connecting lines between close particles
			const maxDist = 110;
			for (let i = 0; i < particles.length; i++) {
				const a = particles[i];
				for (let j = i + 1; j < particles.length; j++) {
					const b = particles[j];
					const dx = a.x - b.x;
					const dy = a.y - b.y;
					const d = Math.hypot(dx, dy);
					if (d < maxDist) {
						const alpha = (1 - d / maxDist) * 0.12;
						ctx.strokeStyle = `rgba(200, 210, 255, ${alpha.toFixed(3)})`;
						ctx.lineWidth = 0.6;
						ctx.beginPath();
						ctx.moveTo(a.x, a.y);
						ctx.lineTo(b.x, b.y);
						ctx.stroke();
					}
				}
			}
		}

		function onMove(e: PointerEvent) {
			if (!rootEl) return;
			const rect = rootEl.getBoundingClientRect();
			mouseX = e.clientX - rect.left;
			mouseY = e.clientY - rect.top;
		}

		resize();
		raf = requestAnimationFrame(step);

		const ro = new ResizeObserver(resize);
		if (rootEl) ro.observe(rootEl);

		window.addEventListener("pointermove", onMove, { passive: true });

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			window.removeEventListener("pointermove", onMove);
		};
	});
</script>

{#if enabled}
	<div
		bind:this={rootEl}
		class="fx-bg"
		aria-hidden="true"
		style:--fx-c1={colors[0]}
		style:--fx-c2={colors[1] ?? colors[0]}
		style:--fx-c3={colors[2] ?? colors[1] ?? colors[0]}
		style:--fx-c4={colors[3] ?? colors[0]}
	>
		<!-- slow drifting aurora blobs -->
		<div class="fx-blob fx-blob-1"></div>
		<div class="fx-blob fx-blob-2"></div>
		<div class="fx-blob fx-blob-3"></div>
		<div class="fx-blob fx-blob-4"></div>

		<!-- mouse-following soft glow -->
		<div
			class="fx-mouse-glow"
			style:transform="translate3d({glowX}px, {glowY}px, 0)"
		></div>

		<!-- particle field -->
		<canvas
			bind:this={canvasEl}
			class="fx-canvas"
			style:opacity={reducedMotion ? 0.5 : 1}
		></canvas>

		<!-- subtle vignette to tie everything together -->
		<div class="fx-vignette"></div>
	</div>
{/if}

<style>
	/* The aurora layer sits behind the page content but above the <html>
	   background color (--page-bg), which acts as the fallback while the
	   island hydrates and below the visible viewport when scrolling. */
	.fx-bg {
		position: fixed;
		inset: 0;
		z-index: -1;
		pointer-events: none;
		overflow: hidden;
		contain: strict;
		background-color: transparent;
	}

	.fx-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		will-change: opacity;
	}

	.fx-blob {
		position: absolute;
		width: 55vmax;
		height: 55vmax;
		border-radius: 50%;
		filter: blur(90px);
		opacity: 0.55;
		mix-blend-mode: screen;
		will-change: transform;
		animation: fxDrift 22s ease-in-out infinite alternate;
	}

	:global(.dark) .fx-blob {
		opacity: 0.45;
	}

	.fx-blob-1 {
		background: radial-gradient(
			circle at 30% 30%,
			var(--fx-c1) 0%,
			transparent 60%
		);
		top: -20vmax;
		left: -10vmax;
		animation-duration: 24s;
	}

	.fx-blob-2 {
		background: radial-gradient(
			circle at 70% 40%,
			var(--fx-c2) 0%,
			transparent 65%
		);
		top: -10vmax;
		right: -15vmax;
		animation-duration: 30s;
		animation-delay: -6s;
	}

	.fx-blob-3 {
		background: radial-gradient(
			circle at 50% 60%,
			var(--fx-c3) 0%,
			transparent 65%
		);
		bottom: -25vmax;
		left: 10vmax;
		animation-duration: 28s;
		animation-delay: -10s;
	}

	.fx-blob-4 {
		background: radial-gradient(
			circle at 50% 50%,
			var(--fx-c4) 0%,
			transparent 65%
		);
		bottom: -15vmax;
		right: -5vmax;
		animation-duration: 34s;
		animation-delay: -14s;
	}

	/* The mouse glow that trails the cursor */
	.fx-mouse-glow {
		position: absolute;
		left: -240px;
		top: -240px;
		width: 480px;
		height: 480px;
		border-radius: 50%;
		background: radial-gradient(
			circle at center,
			hsla(var(--hue), 90%, 70%, 0.18) 0%,
			hsla(var(--hue), 90%, 70%, 0.08) 35%,
			transparent 70%
		);
		filter: blur(8px);
		pointer-events: none;
		transition: opacity 300ms ease;
		will-change: transform;
		mix-blend-mode: screen;
	}

	:global(.dark) .fx-mouse-glow {
		background: radial-gradient(
			circle at center,
			hsla(var(--hue), 95%, 65%, 0.22) 0%,
			hsla(var(--hue), 95%, 65%, 0.1) 35%,
			transparent 70%
		);
	}

	.fx-vignette {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(
				120% 80% at 50% 0%,
				transparent 60%,
				rgba(0, 0, 0, 0.08) 100%
			);
		pointer-events: none;
	}

	:global(.dark) .fx-vignette {
		background:
			radial-gradient(
				120% 80% at 50% 0%,
				transparent 50%,
				rgba(0, 0, 0, 0.45) 100%
			);
	}

	@keyframes fxDrift {
		0% {
			transform: translate3d(0, 0, 0) scale(1);
		}
		50% {
			transform: translate3d(8vmax, -6vmax, 0) scale(1.15);
		}
		100% {
			transform: translate3d(-6vmax, 6vmax, 0) scale(0.92);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.fx-blob {
			animation: none;
		}
	}
</style>
