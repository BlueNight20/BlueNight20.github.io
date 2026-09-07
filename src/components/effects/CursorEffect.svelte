<!--
  CursorEffect.svelte
  ------------------------------------------------------------------------
  Custom cursor + click ripple / sparkle effects.

  Modes:
    - "default"  : dot + ring (smooth lerp) + click ripple
    - "sparkle"  : dot + ring + click sparkle particles
    - "ripple"   : click ripple only, native cursor stays

  Behavior:
    - Hidden on touch devices (no hover cursor there).
    - Respects prefers-reduced-motion (no lerp animation).
    - Mounted once in Layout.astro so it survives swup navigations.
-->
<script lang="ts">
import { onMount } from "svelte";
import { siteConfig } from "../../config";

	type Props = {
		/**
		 * Optional accent color used by the cursor dot / ring / ripple.
		 * When omitted the theme's --hue based accent is used.
		 */
		accentColor?: string;
	};

	const { accentColor }: Props = $props();

	const enabled = siteConfig.effects.cursorEffect.enable;
	const mode: "default" | "sparkle" | "ripple" =
		siteConfig.effects.cursorEffect.mode ?? "default";
	const showFollower = mode === "default" || mode === "sparkle";

	let dotX = $state(0);
	let dotY = $state(0);
	let ringX = $state(0);
	let ringY = $state(0);
	let ringVisible = $state(false);
	let hovering = $state(false);
	let pressing = $state(false);

	type Ripple = { id: number; x: number; y: number; color: string };
	type Sparkle = {
		id: number;
		x: number;
		y: number;
		vx: number;
		vy: number;
		life: number;
		max: number;
		size: number;
		color: string;
	};

	let ripples = $state<Ripple[]>([]);
	let sparkles = $state<Sparkle[]>([]);

	let rippleId = 0;
	let sparkleId = 0;

	const COLORS = [
		"rgb(167,139,250)",
		"rgb(96,165,250)",
		"rgb(244,114,182)",
		"rgb(52,211,153)",
	];

	const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)];

	function isInteractive(el: Element | null): boolean {
		let cur: Element | null = el;
		while (cur && cur !== document.body) {
			if (!(cur instanceof HTMLElement)) {
				cur = cur.parentElement;
				continue;
			}
			const tag = cur.tagName;
			if (
				tag === "A" ||
				tag === "BUTTON" ||
				tag === "INPUT" ||
				tag === "TEXTAREA" ||
				tag === "SELECT" ||
				cur.isContentEditable ||
				cur.dataset?.cursorInteractive === "true"
			) {
				return true;
			}
			cur = cur.parentElement;
		}
		return false;
	}

	onMount(() => {
		if (!enabled) return;

		const isTouch =
			window.matchMedia?.("(hover: none) and (pointer: coarse)").matches ?? false;
		const reducedMotion =
			window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
		if (isTouch) return;

		// Only now (custom cursor is live on a fine-pointer device) hide the
		// native cursor. Ripple-only mode keeps the native cursor.
		if (showFollower) document.documentElement.classList.add("fx-cursor-on");

		let raf = 0;
		let lastMove = performance.now();

		const onMove = (e: PointerEvent) => {
			dotX = e.clientX;
			dotY = e.clientY;
			ringVisible = true;
			lastMove = performance.now();
			hovering = isInteractive(e.target as Element);
		};
		const onDown = (e: PointerEvent) => {
			pressing = true;
			const id = ++rippleId;
			ripples = [...ripples, { id, x: e.clientX, y: e.clientY, color: pick() }];
			setTimeout(() => {
				ripples = ripples.filter((r) => r.id !== id);
			}, 900);
			if (mode === "sparkle") {
				for (let i = 0; i < 12; i++) {
					const a = Math.random() * Math.PI * 2;
					const sp = 1.5 + Math.random() * 3;
					sparkles = [
						...sparkles,
						{
							id: ++sparkleId,
							x: e.clientX,
							y: e.clientY,
							vx: Math.cos(a) * sp,
							vy: Math.sin(a) * sp,
							life: 0,
							max: 700 + Math.random() * 500,
							size: 2 + Math.random() * 3,
							color: pick(),
						},
					];
				}
			}
		};
		const onUp = () => (pressing = false);
		const onLeave = () => (ringVisible = false);

		const tick = () => {
			raf = requestAnimationFrame(tick);
			const speed = reducedMotion ? 1 : 0.22;
			ringX += (dotX - ringX) * speed;
			ringY += (dotY - ringY) * speed;

			if (sparkles.length) {
				const dt = 16;
				const next: Sparkle[] = [];
				for (const s of sparkles) {
					const life = s.life + dt;
					if (life >= s.max) continue;
					next.push({
						...s,
						x: s.x + s.vx,
						y: s.y + s.vy,
						vy: s.vy + 0.04,
						life,
					});
				}
				sparkles = next;
			}
			if (performance.now() - lastMove > 1500) ringVisible = false;
		};

		raf = requestAnimationFrame(tick);
		window.addEventListener("pointermove", onMove, { passive: true });
		window.addEventListener("pointerdown", onDown, { passive: true });
		window.addEventListener("pointerup", onUp, { passive: true });
		document.addEventListener("mouseleave", onLeave);
		window.addEventListener("blur", onLeave);

		return () => {
			cancelAnimationFrame(raf);
			document.documentElement.classList.remove("fx-cursor-on");
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerdown", onDown);
			window.removeEventListener("pointerup", onUp);
			document.removeEventListener("mouseleave", onLeave);
			window.removeEventListener("blur", onLeave);
		};
	});
</script>

{#if enabled}
	<div
		class="fx-cursor"
		aria-hidden="true"
		style:--fx-accent={accentColor}
	>
		{#if showFollower}
			<div
				class="fx-ring"
				class:visible={ringVisible}
				class:hover={hovering}
				class:press={pressing}
				style:transform="translate3d({ringX}px, {ringY}px, 0)"
			></div>
			<div
				class="fx-dot"
				class:visible={ringVisible}
				class:press={pressing}
				style:transform="translate3d({dotX}px, {dotY}px, 0)"
			></div>
		{/if}

		{#each ripples as r (r.id)}
			<span
				class="fx-ripple"
				style:left="{r.x}px"
				style:top="{r.y}px"
				style:--ripple-color={r.color}
			></span>
		{/each}

		{#each sparkles as s (s.id)}
			<span
				class="fx-sparkle"
				style:left="{s.x}px"
				style:top="{s.y}px"
				style:width="{s.size}px"
				style:height="{s.size}px"
				style:background={s.color}
				style:opacity={Math.max(0, 1 - s.life / s.max)}
			></span>
		{/each}
	</div>
{/if}

<style>
	.fx-cursor {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 9999;
	}

	.fx-dot {
		position: absolute;
		left: -4px;
		top: -4px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--fx-accent, hsl(var(--hue), 90%, 55%));
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.65);
		opacity: 0;
		transition:
			opacity 220ms ease,
			width 180ms ease,
			height 180ms ease,
			left 180ms ease,
			top 180ms ease;
		will-change: transform;
	}

	:global(.dark) .fx-dot {
		background: var(--fx-accent, hsl(var(--hue), 95%, 70%));
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
	}

	.fx-dot.visible {
		opacity: 1;
	}

	.fx-dot.press {
		width: 5px;
		height: 5px;
		left: -2.5px;
		top: -2.5px;
	}

	.fx-ring {
		position: absolute;
		left: -18px;
		top: -18px;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 1.5px solid var(--fx-accent, hsl(var(--hue), 90%, 55%));
		opacity: 0;
		transition:
			opacity 200ms ease,
			width 220ms ease,
			height 220ms ease,
			left 220ms ease,
			top 220ms ease,
			background-color 200ms ease,
			border-color 200ms ease;
		will-change: transform;
	}

	:global(.dark) .fx-ring {
		border-color: var(--fx-accent, hsl(var(--hue), 95%, 70%));
	}

	.fx-ring.visible {
		opacity: 0.85;
	}

	.fx-ring.hover {
		width: 58px;
		height: 58px;
		left: -29px;
		top: -29px;
		opacity: 1;
		background-color: color-mix(in srgb, var(--fx-accent, hsl(var(--hue), 90%, 60%)) 12%, transparent);
		border-color: var(--fx-accent, hsl(var(--hue), 90%, 60%));
	}

	.fx-ring.press {
		width: 26px;
		height: 26px;
		left: -13px;
		top: -13px;
	}

	.fx-ripple {
		position: absolute;
		width: 0;
		height: 0;
		border-radius: 50%;
		border: 2px solid var(--ripple-color, hsl(var(--hue), 90%, 60%));
		transform: translate(-50%, -50%);
		animation: fxRipple 900ms ease-out forwards;
	}

	@keyframes fxRipple {
		0% {
			width: 0;
			height: 0;
			opacity: 0.8;
			border-width: 2px;
		}
		100% {
			width: 280px;
			height: 280px;
			opacity: 0;
			border-width: 1px;
		}
	}

	.fx-sparkle {
		position: absolute;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		will-change: transform, opacity;
	}

	@media (prefers-reduced-motion: reduce) {
		.fx-ripple {
			animation-duration: 600ms;
		}
	}
</style>
