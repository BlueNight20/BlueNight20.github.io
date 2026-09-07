import type { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants";

export type EffectsConfig = {
	dynamicBackground: {
		enable: boolean;
		/**
		 * Aurora color blobs in hex (3 or 4 colors). They will be used to build
		 * large soft radial gradients that slowly drift across the screen.
		 */
		colors?: [string, string, string] | [string, string, string, string];
		/**
		 * Density of the floating particles drawn on the canvas (0..1).
		 */
		particleDensity?: number;
	};
	cursorEffect: {
		enable: boolean;
		/**
		 * "default"  : dot + ring  + click ripple
		 * "ripple"   : click ripple only (no custom cursor follower)
		 * "sparkle"  : dot + ring + click sparkle particles
		 */
		mode?: "default" | "ripple" | "sparkle";
	};
};

export type SiteConfig = {
	title: string;
	subtitle: string;

	lang:
		| "en"
		| "zh_CN"
		| "zh_TW"
		| "ja"
		| "ko"
		| "es"
		| "th"
		| "vi"
		| "tr"
		| "id";

	themeColor: {
		hue: number;
		fixed: boolean;
	};
	banner: {
		enable: boolean;
		src: string;
		position?: "top" | "center" | "bottom";
		credit: {
			enable: boolean;
			text: string;
			url?: string;
		};
	};
	toc: {
		enable: boolean;
		depth: 1 | 2 | 3;
	};

	favicon: Favicon[];

	effects: EffectsConfig;
};

export type Favicon = {
	src: string;
	theme?: "light" | "dark";
	sizes?: string;
};

export enum LinkPreset {
	Home = 0,
	Archive = 1,
	About = 2,
}

export type NavBarLink = {
	name: string;
	url: string;
	external?: boolean;
};

export type NavBarConfig = {
	links: (NavBarLink | LinkPreset)[];
};

export type ProfileConfig = {
	avatar?: string;
	name: string;
	bio?: string;
	links: {
		name: string;
		url: string;
		icon: string;
	}[];
};

export type LicenseConfig = {
	enable: boolean;
	name: string;
	url: string;
};

export type LIGHT_DARK_MODE =
	| typeof LIGHT_MODE
	| typeof DARK_MODE
	| typeof AUTO_MODE;

export type BlogPostData = {
	body: string;
	title: string;
	published: Date;
	description: string;
	tags: string[];
	draft?: boolean;
	image?: string;
	category?: string;
	prevTitle?: string;
	prevSlug?: string;
	nextTitle?: string;
	nextSlug?: string;
};

export type ExpressiveCodeConfig = {
	theme: string;
};
