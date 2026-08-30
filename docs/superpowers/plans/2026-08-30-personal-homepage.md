# Personal Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an identity-first personal homepage to the Fuwari blog while preserving its existing article feed, pagination, archive, and post pages.

**Architecture:** Homepage-specific copy and lists live in a typed static configuration module. Small Astro components render the hero, sidebar extras, projects, and timeline. The paginated homepage enables these components only when `page.currentPage === 1`, while `MainGridLayout` exposes optional slots whose defaults leave every other page unchanged.

**Tech Stack:** Astro 5, TypeScript, Tailwind CSS 3, Node built-in test runner, existing Fuwari components and design tokens.

**Spec:** `docs/superpowers/specs/2026-08-30-personal-homepage-design.md`

## Global Constraints

- Do not add runtime dependencies or external API calls.
- Keep the existing `PostPage`, `PostCard`, pagination, archive, search, theme switching, categories, and tags behavior.
- Show personal homepage sections only on homepage page 1.
- Keep `VulnBot` visibly labeled `研究项目 · Fork`.
- Use `rel="noopener noreferrer"` on external project links.
- Hide empty project and timeline sections.
- Preserve readable light and dark themes and a one-column mobile layout without horizontal overflow.
- Run all commands from `D:\博客\BlueNight20.github.io`.

## File Structure

- Create `src/types/home.ts`: homepage configuration interfaces only.
- Create `src/config/home.ts`: editable hero, current activity, focus areas, projects, and timeline content.
- Create `src/components/home/HomeHero.astro`: banner overlay and internal hero actions.
- Create `src/components/home/HomeSidebar.astro`: "现在" and "关注方向" cards.
- Create `src/components/home/FeaturedProjects.astro`: static external project cards.
- Create `src/components/home/RecentTimeline.astro`: recent-activity sequence.
- Modify `src/components/widget/SideBar.astro`: accept and render an optional `extras` slot.
- Modify `src/layouts/MainGridLayout.astro`: accept homepage state, render banner/sidebar slots, and adjust homepage mobile ordering.
- Modify `src/pages/[...page].astro`: compose personal sections only on page 1 before the existing post feed.
- Create `tests/homepage-output.test.mjs`: assert the generated homepage contract with Node's built-in test runner.

---

### Task 1: Personal hero and page-one gate

**Files:**
- Create: `src/types/home.ts`
- Create: `src/config/home.ts`
- Create: `src/components/home/HomeHero.astro`
- Create: `tests/homepage-output.test.mjs`
- Modify: `src/layouts/MainGridLayout.astro`
- Modify: `src/pages/[...page].astro`

**Interfaces:**
- Produces: `HomeHeroConfig`, `HomeConfig`, and `homeConfig` for all later homepage components.
- Produces: optional `bannerOverlay` slot and `isHomePage?: boolean` layout prop.
- Consumes: existing `url(path: string)` helper for base-aware internal links.

- [ ] **Step 1: Write the failing hero output test**

Create `tests/homepage-output.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readHome = () => readFile(new URL("../dist/index.html", import.meta.url), "utf8");

test("homepage renders the personal hero and internal actions", async () => {
	const html = await readHome();
	assert.match(html, /data-home-hero/);
	assert.match(html, /你好，我是 BlueNight。/);
	assert.match(html, /href="\/about\/"/);
	assert.match(html, /href="\/#now"/);
});
```

- [ ] **Step 2: Build and verify the hero test fails for the intended reason**

Run:

```powershell
pnpm build
node --test --test-name-pattern="personal hero" tests/homepage-output.test.mjs
```

Expected: the build succeeds, then the test fails because `data-home-hero` is absent from `dist/index.html`.

- [ ] **Step 3: Define the homepage interfaces**

Create `src/types/home.ts`:

```ts
export type HomeLink = {
	label: string;
	href: string;
};

export type HomeHeroConfig = {
	title: string;
	description: string;
	primaryAction: HomeLink;
	secondaryAction: HomeLink;
};

export type HomeProject = {
	name: string;
	description: string;
	url: string;
	typeLabel: string;
	technologies?: string[];
};

export type HomeTimelineItem = {
	title: string;
	description: string;
};

export type HomeConfig = {
	hero: HomeHeroConfig;
	now: string;
	focusAreas: string[];
	projects: HomeProject[];
	timeline: HomeTimelineItem[];
};
```

- [ ] **Step 4: Add the initial typed homepage configuration**

Create `src/config/home.ts` with hero content and empty arrays for sections implemented later:

```ts
import type { HomeConfig } from "@/types/home";

export const homeConfig: HomeConfig = {
	hero: {
		title: "你好，我是 BlueNight。",
		description:
			"关注自动化渗透测试与多智能体系统，在这里记录研究、工具和一路踩过的坑。",
		primaryAction: { label: "了解我", href: "/about/" },
		secondaryAction: { label: "最近在做什么", href: "/#now" },
	},
	now: "",
	focusAreas: [],
	projects: [],
	timeline: [],
};
```

- [ ] **Step 5: Implement the hero component**

Create `src/components/home/HomeHero.astro`:

```astro
---
import { homeConfig } from "@/config/home";
import { url } from "@utils/url-utils";

const { hero } = homeConfig;
---

<section data-home-hero class="w-full max-w-[var(--page-width)] mx-auto px-4 pb-8">
  <div class="max-w-2xl rounded-2xl bg-black/45 backdrop-blur-md px-6 py-5 text-white shadow-lg">
    <h1 class="text-3xl md:text-4xl font-bold mb-3">{hero.title}</h1>
    <p class="text-white/85 leading-relaxed">{hero.description}</p>
    <div class="flex flex-wrap gap-3 mt-5">
      <a class="btn-regular px-4 h-10 rounded-lg" href={url(hero.primaryAction.href)}>{hero.primaryAction.label}</a>
      <a class="btn-plain px-4 h-10 rounded-lg bg-black/25" href={url(hero.secondaryAction.href)}>{hero.secondaryAction.label}</a>
    </div>
  </div>
</section>
```

- [ ] **Step 6: Add the optional banner overlay hook**

In `src/layouts/MainGridLayout.astro`, add `isHomePage?: boolean` to `Props`, default it to `false`, and render the named slot after `ImageWrapper` inside `#banner-wrapper`:

```astro
interface Props {
	// existing fields stay unchanged
	isHomePage?: boolean;
}

const {
	// existing fields stay unchanged
	isHomePage = false,
} = Astro.props;
```

```astro
<div class="absolute inset-0 z-20 flex items-end pointer-events-none">
  <div class="w-full pointer-events-auto">
    <slot name="bannerOverlay"></slot>
  </div>
</div>
```

Do not change banner rendering when the slot is absent.

- [ ] **Step 7: Gate the hero to homepage page 1**

In `src/pages/[...page].astro`, import `HomeHero`, define the gate, pass `isHomePage`, and provide the named slot:

```astro
import HomeHero from "@components/home/HomeHero.astro";

const isHomePage = page.currentPage === 1;
```

```astro
<MainGridLayout isHomePage={isHomePage}>
  {isHomePage && <HomeHero slot="bannerOverlay" />}
  <PostPage page={page}></PostPage>
  <Pagination class="mx-auto onload-animation" page={page} style={`animation-delay: calc(var(--content-delay) + ${(len)*50}ms)`}></Pagination>
</MainGridLayout>
```

- [ ] **Step 8: Verify the hero test and type check pass**

Run:

```powershell
pnpm build
node --test --test-name-pattern="personal hero" tests/homepage-output.test.mjs
pnpm check
```

Expected: hero test passes and Astro reports zero errors.

- [ ] **Step 9: Commit the hero slice**

```powershell
git add src/types/home.ts src/config/home.ts src/components/home/HomeHero.astro src/layouts/MainGridLayout.astro 'src/pages/[...page].astro' tests/homepage-output.test.mjs
git commit -m "feat: add personal homepage hero"
```

---

### Task 2: Homepage sidebar content and responsive ordering

**Files:**
- Create: `src/components/home/HomeSidebar.astro`
- Modify: `src/config/home.ts`
- Modify: `src/components/widget/SideBar.astro`
- Modify: `src/layouts/MainGridLayout.astro`
- Modify: `src/pages/[...page].astro`
- Modify: `tests/homepage-output.test.mjs`

**Interfaces:**
- Consumes: `homeConfig.now: string` and `homeConfig.focusAreas: string[]`.
- Produces: `extras` sidebar slot and `#now` anchor.
- Consumes: `isHomePage` layout prop introduced in Task 1.

- [ ] **Step 1: Add the failing sidebar output test**

Append to `tests/homepage-output.test.mjs`:

```js
test("homepage renders current activity and focus areas", async () => {
	const html = await readHome();
	assert.match(html, /id="now"/);
	assert.match(html, /正在整理多智能体自动化渗透测试/);
	for (const label of ["Pentest", "Multi-Agent", "LLM", "Web Security", "Python"]) {
		assert.match(html, new RegExp(label));
	}
});
```

- [ ] **Step 2: Verify the sidebar test fails**

Run:

```powershell
node --test --test-name-pattern="current activity" tests/homepage-output.test.mjs
```

Expected: FAIL because `id="now"` is absent.

- [ ] **Step 3: Add sidebar configuration values**

Update `src/config/home.ts`:

```ts
now: "正在整理多智能体自动化渗透测试的实验过程与工程实践。",
focusAreas: ["Pentest", "Multi-Agent", "LLM", "Web Security", "Python"],
```

- [ ] **Step 4: Implement `HomeSidebar`**

Create `src/components/home/HomeSidebar.astro`:

```astro
---
import { homeConfig } from "@/config/home";
---

<div class="flex flex-col gap-4">
  <section id="now" class="card-base p-5 scroll-mt-24">
    <h2 class="font-bold text-lg mb-2 before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)] before:inline-block before:mr-2">现在</h2>
    <p class="text-75 leading-relaxed">{homeConfig.now}</p>
  </section>

  <section class="card-base p-5">
    <h2 class="font-bold text-lg mb-3 before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)] before:inline-block before:mr-2">关注方向</h2>
    <div class="flex flex-wrap gap-2">
      {homeConfig.focusAreas.map((area) => <span class="text-sm px-2.5 py-1 rounded-md bg-[var(--btn-regular-bg)] text-75">{area}</span>)}
    </div>
  </section>
</div>
```

- [ ] **Step 5: Add the sidebar slot without changing default pages**

In `src/components/widget/SideBar.astro`, render the optional slot immediately after the existing `Profile` wrapper and before `#sidebar-sticky`:

```astro
<div class="flex flex-col w-full gap-4 mb-4">
  <Profile></Profile>
  <slot name="extras"></slot>
</div>
```

In `src/layouts/MainGridLayout.astro`, forward `sidebarExtras` into the new slot:

```astro
<SideBar class={sidebarClass} headings={headings}>
  <slot name="sidebarExtras" slot="extras"></slot>
</SideBar>
```

- [ ] **Step 6: Apply homepage-only mobile ordering**

In the `MainGridLayout.astro` frontmatter, compute exact class strings:

```ts
const sidebarClass = isHomePage
	? "mb-4 row-start-1 row-end-2 col-span-2 lg:row-start-1 lg:row-end-2 lg:col-span-1 lg:max-w-[17.5rem] onload-animation"
	: "mb-4 row-start-2 row-end-3 col-span-2 lg:row-start-1 lg:row-end-2 lg:col-span-1 lg:max-w-[17.5rem] onload-animation";

const mainClass = isHomePage
	? "transition-swup-fade row-start-2 col-span-2 lg:row-start-1 lg:col-span-1 overflow-hidden"
	: "transition-swup-fade col-span-2 lg:col-span-1 overflow-hidden";
```

Use `sidebarClass` on `SideBar` and `mainClass` on the existing `<main id="swup-container">`.

- [ ] **Step 7: Supply sidebar extras only on page 1**

In `src/pages/[...page].astro`, import `HomeSidebar` and add:

```astro
{isHomePage && <HomeSidebar slot="sidebarExtras" />}
```

- [ ] **Step 8: Build and verify the sidebar test passes**

Run:

```powershell
pnpm build
node --test --test-name-pattern="current activity" tests/homepage-output.test.mjs
pnpm check
```

Expected: sidebar test passes and Astro reports zero errors.

- [ ] **Step 9: Commit the sidebar slice**

```powershell
git add src/config/home.ts src/components/home/HomeSidebar.astro src/components/widget/SideBar.astro src/layouts/MainGridLayout.astro 'src/pages/[...page].astro' tests/homepage-output.test.mjs
git commit -m "feat: add personal homepage sidebar"
```

---

### Task 3: Curated project section

**Files:**
- Create: `src/components/home/FeaturedProjects.astro`
- Modify: `src/config/home.ts`
- Modify: `src/pages/[...page].astro`
- Modify: `tests/homepage-output.test.mjs`

**Interfaces:**
- Consumes: `homeConfig.projects: HomeProject[]`.
- Produces: `[data-featured-projects]` section; renders nothing when the list is empty.

- [ ] **Step 1: Add the failing projects output test**

Append to `tests/homepage-output.test.mjs`:

```js
test("homepage renders the curated projects with safe external links", async () => {
	const html = await readHome();
	assert.match(html, /data-featured-projects/);
	for (const repo of ["VulnBot", "wxchat", "BlueNight20.github.io"]) {
		assert.match(html, new RegExp(repo.replace(".", "\\.")));
	}
	assert.match(html, /研究项目 · Fork/);
	assert.match(html, /rel="noopener noreferrer"/);
});
```

- [ ] **Step 2: Verify the project test fails**

Run:

```powershell
node --test --test-name-pattern="curated projects" tests/homepage-output.test.mjs
```

Expected: FAIL because `data-featured-projects` is absent.

- [ ] **Step 3: Add the three curated projects**

Replace the empty `projects` array in `src/config/home.ts`:

```ts
projects: [
	{
		name: "VulnBot",
		description: "面向自主渗透测试的多智能体协作框架。",
		url: "https://github.com/BlueNight20/VulnBot",
		typeLabel: "研究项目 · Fork",
		technologies: ["Python", "Multi-Agent"],
	},
	{
		name: "wxchat",
		description: "一个微信聊天界面模拟与交互实验。",
		url: "https://github.com/BlueNight20/wxchat",
		typeLabel: "个人项目",
		technologies: ["HTML", "Frontend"],
	},
	{
		name: "BlueNight20.github.io",
		description: "使用 Astro 与 Fuwari 构建的个人技术博客。",
		url: "https://github.com/BlueNight20/BlueNight20.github.io",
		typeLabel: "本站源码",
		technologies: ["Astro", "Svelte"],
	},
],
```

- [ ] **Step 4: Implement `FeaturedProjects`**

Create `src/components/home/FeaturedProjects.astro`:

```astro
---
import { Icon } from "astro-icon/components";
import { homeConfig } from "@/config/home";

const projects = homeConfig.projects;
---

{projects.length > 0 && (
  <section data-featured-projects class="mb-4 onload-animation">
    <div class="flex items-center justify-between px-1 mb-3">
      <h2 class="font-bold text-xl">精选项目</h2>
      <a class="text-sm text-[var(--primary)]" href="https://github.com/BlueNight20" target="_blank" rel="noopener noreferrer">在 GitHub 查看全部</a>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      {projects.map((project) => (
        <a class="card-base p-4 min-h-40 flex flex-col active:scale-[0.98]" href={project.url} target="_blank" rel="noopener noreferrer">
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-bold text-lg text-90">{project.name}</h3>
            <Icon name="fa6-solid:arrow-up-right-from-square" class="text-[var(--primary)] mt-1" />
          </div>
          <div class="text-xs text-[var(--primary)] mt-1">{project.typeLabel}</div>
          <p class="text-sm text-75 leading-relaxed mt-3 flex-1">{project.description}</p>
          {project.technologies && project.technologies.length > 0 && (
            <div class="flex flex-wrap gap-2 mt-4">
              {project.technologies.map((technology) => <span class="text-xs text-50">#{technology}</span>)}
            </div>
          )}
        </a>
      ))}
    </div>
  </section>
)}
```

- [ ] **Step 5: Render projects before posts on page 1**

In `src/pages/[...page].astro`, import `FeaturedProjects` and place this immediately before `PostPage`:

```astro
{isHomePage && <FeaturedProjects />}
```

- [ ] **Step 6: Build and verify the project contract**

Run:

```powershell
pnpm build
node --test --test-name-pattern="curated projects" tests/homepage-output.test.mjs
pnpm check
```

Expected: project test passes and Astro reports zero errors.

- [ ] **Step 7: Commit the project slice**

```powershell
git add src/config/home.ts src/components/home/FeaturedProjects.astro 'src/pages/[...page].astro' tests/homepage-output.test.mjs
git commit -m "feat: add curated homepage projects"
```

---

### Task 4: Recent activity timeline

**Files:**
- Create: `src/components/home/RecentTimeline.astro`
- Modify: `src/config/home.ts`
- Modify: `src/pages/[...page].astro`
- Modify: `tests/homepage-output.test.mjs`

**Interfaces:**
- Consumes: `homeConfig.timeline: HomeTimelineItem[]`.
- Produces: `[data-recent-timeline]` section; renders nothing when the list is empty.

- [ ] **Step 1: Add the failing timeline output test**

Append to `tests/homepage-output.test.mjs`:

```js
test("homepage renders the recent activity timeline", async () => {
	const html = await readHome();
	assert.match(html, /data-recent-timeline/);
	assert.match(html, /搭建个人技术博客/);
	assert.match(html, /研究自动化渗透测试/);
	assert.match(html, /整理开源项目/);
});
```

- [ ] **Step 2: Verify the timeline test fails**

Run:

```powershell
node --test --test-name-pattern="activity timeline" tests/homepage-output.test.mjs
```

Expected: FAIL because `data-recent-timeline` is absent.

- [ ] **Step 3: Add timeline content**

Replace the empty `timeline` array in `src/config/home.ts`:

```ts
timeline: [
	{
		title: "搭建个人技术博客",
		description: "让零散笔记沉淀为可以长期维护的内容。",
	},
	{
		title: "研究自动化渗透测试",
		description: "持续记录任务规划、工具调用与多智能体协作。",
	},
	{
		title: "整理开源项目",
		description: "补充说明、实践案例与复现过程。",
	},
],
```

- [ ] **Step 4: Implement `RecentTimeline`**

Create `src/components/home/RecentTimeline.astro`:

```astro
---
import { homeConfig } from "@/config/home";

const timeline = homeConfig.timeline;
---

{timeline.length > 0 && (
  <section data-recent-timeline class="card-base p-5 md:p-6 mb-4 onload-animation">
    <h2 class="font-bold text-xl mb-5 before:w-1 before:h-5 before:rounded-md before:bg-[var(--primary)] before:inline-block before:mr-3">近期轨迹</h2>
    <ol class="relative border-l-2 border-black/10 dark:border-white/10 ml-2">
      {timeline.map((item) => (
        <li class="relative pl-6 pb-5 last:pb-0">
          <span class="absolute -left-[0.45rem] top-1.5 w-3 h-3 rounded-full bg-[var(--primary)] outline outline-4 outline-[var(--card-bg)]"></span>
          <h3 class="font-bold text-90">{item.title}</h3>
          <p class="text-sm text-75 leading-relaxed mt-1">{item.description}</p>
        </li>
      ))}
    </ol>
  </section>
)}
```

- [ ] **Step 5: Render timeline between projects and posts**

In `src/pages/[...page].astro`, import `RecentTimeline` and place it after `FeaturedProjects` and before `PostPage`:

```astro
{isHomePage && <RecentTimeline />}
```

- [ ] **Step 6: Build and verify the timeline contract**

Run:

```powershell
pnpm build
node --test --test-name-pattern="activity timeline" tests/homepage-output.test.mjs
pnpm check
```

Expected: timeline test passes and Astro reports zero errors.

- [ ] **Step 7: Commit the timeline slice**

```powershell
git add src/config/home.ts src/components/home/RecentTimeline.astro 'src/pages/[...page].astro' tests/homepage-output.test.mjs
git commit -m "feat: add homepage activity timeline"
```

---

### Task 5: Page gate, regression checks, and responsive verification

**Files:**
- Modify: `tests/homepage-output.test.mjs`
- Modify if verification exposes a defect: only files created or modified in Tasks 1-4.

**Interfaces:**
- Consumes: all homepage markers and the `isHomePage` gate from Tasks 1-4.
- Produces: a verified production build with no regression to existing routes.

- [ ] **Step 1: Add a source-level gate test and route regression test**

Append to `tests/homepage-output.test.mjs`:

```js
test("personal sections are explicitly gated to homepage page one", async () => {
	const source = await readFile(
		new URL("../src/pages/[...page].astro", import.meta.url),
		"utf8",
	);
	assert.match(source, /page\.currentPage === 1/);
	assert.match(source, /isHomePage && <FeaturedProjects/);
	assert.match(source, /isHomePage && <RecentTimeline/);
});

test("existing static routes still build", async () => {
	for (const path of ["../dist/archive/index.html", "../dist/about/index.html"]) {
		const html = await readFile(new URL(path, import.meta.url), "utf8");
		assert.doesNotMatch(html, /data-featured-projects|data-recent-timeline|data-home-hero/);
	}
});
```

- [ ] **Step 2: Temporarily break the page-one gate to prove the test is sensitive**

Change `const isHomePage = page.currentPage === 1;` to `const isHomePage = true;`, then run:

```powershell
node --test --test-name-pattern="explicitly gated" tests/homepage-output.test.mjs
```

Expected: FAIL because the required `page.currentPage === 1` expression is absent. Restore the original expression immediately after observing the failure.

- [ ] **Step 3: Run the complete automated verification suite**

Run:

```powershell
pnpm check
pnpm build
node --test tests/homepage-output.test.mjs
git diff --check
```

Expected:

- Astro check reports zero errors.
- Production build and Pagefind indexing complete successfully.
- All homepage output tests pass.
- `git diff --check` exits successfully.

- [ ] **Step 4: Verify desktop layout at 1440 × 900**

Run `pnpm dev`, open `http://localhost:4321/`, and verify:

- Hero copy remains readable over the banner.
- Sidebar and main column align with the current Fuwari grid.
- Three project cards have equal visual weight and no clipped text.
- Timeline appears before the unchanged post cards.
- Existing categories and tags remain visible.
- Both hero actions and all project links work.

- [ ] **Step 5: Verify mobile layout at 390 × 844**

Using browser responsive mode, verify:

- No horizontal scroll is present.
- Hero actions wrap without overlap.
- Content order is profile, now, focus areas, categories/tags, projects, timeline, posts.
- Project cards become one column.
- Post cards and navigation retain their existing mobile behavior.

- [ ] **Step 6: Verify light and dark themes**

Toggle the existing theme control in both desktop and mobile widths. Verify hero copy, project labels, timeline text, focus tags, links, and focus indicators remain readable in both themes.

- [ ] **Step 7: Commit final verification adjustments**

If verification required changes, stage only the files touched by those fixes and the completed test file:

```powershell
git add tests/homepage-output.test.mjs src/components/home src/config/home.ts src/types/home.ts src/components/widget/SideBar.astro src/layouts/MainGridLayout.astro 'src/pages/[...page].astro'
git commit -m "test: verify personal homepage behavior"
```

If no verification adjustment was needed and `tests/homepage-output.test.mjs` was already committed in earlier tasks, do not create an empty commit.
