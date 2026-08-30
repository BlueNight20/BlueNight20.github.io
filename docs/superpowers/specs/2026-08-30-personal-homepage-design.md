# BlueNight Personal Homepage Design

Date: 2026-08-30
Status: Draft for final review

## Purpose

Turn the existing Fuwari homepage into a personal technology homepage without replacing its blog functionality. The first screen should communicate who BlueNight is, what they are currently exploring, and which projects represent their work. The existing chronological post feed remains the main long-term content surface.

## Goals

- Present a clear personal identity before the article feed.
- Highlight current interests in automated penetration testing, multi-agent systems, LLMs, and web security.
- Feature three manually curated GitHub projects.
- Show a short, editable recent-activity timeline.
- Preserve the current Fuwari post cards, pagination, archive, categories, tags, theme switching, and responsive behavior.
- Keep homepage content easy to update without editing component internals.

## Non-goals

- No GitHub API integration or dynamic repository synchronization.
- No visitor analytics dashboard, contribution graph, guestbook, music player, or live status service.
- No redesign of post pages, archive pages, search, navigation behavior, or the global theme system.
- No content management system.

## Information Architecture

The first homepage page uses the following order:

1. Existing banner image and navigation.
2. Personal hero copy over the banner.
3. Existing profile card in the left sidebar.
4. New "Now" and "Focus Areas" sidebar cards.
5. Existing categories and tags below the new sidebar cards.
6. Featured projects in the main column.
7. Recent activity timeline.
8. Existing chronological post list.
9. Existing pagination and footer.

Pagination pages after page 1 omit the personal hero, projects, and timeline. They render the normal Fuwari article feed so repeated navigation remains compact.

## Visual Direction

The implementation follows the approved personal-narrative option:

- Preserve the current dark translucent card language and blue accent color.
- Place the personal introduction in a restrained translucent panel over the existing banner.
- Use the existing page width, border radii, animation timing, and spacing tokens.
- Keep project cards compact and text-led instead of introducing a competing illustration style.
- Use the current Fuwari post cards unchanged below the personal sections.
- Avoid decorative statistics or filler content.

Proposed hero copy:

> 你好，我是 BlueNight。
>
> 关注自动化渗透测试与多智能体系统，在这里记录研究、工具和一路踩过的坑。

The two hero actions link to the About section and the "Now" section respectively.

## Content Model

Homepage-specific content lives in `src/config/home.ts`, separate from component rendering. Its interfaces live in `src/types/home.ts`. The configuration contains:

- Hero title, description, and action labels.
- Current activity text.
- Focus-area labels.
- Three featured projects.
- Recent activity timeline entries.

Each featured project contains:

- Display name.
- Short description.
- Repository URL.
- Project classification.
- Technology labels.

The initial project set is:

1. `VulnBot` — labeled "Research Project · Fork" and described as a multi-agent autonomous penetration-testing framework.
2. `wxchat` — labeled "Personal Project" and described as a WeChat chat-interface simulation.
3. `BlueNight20.github.io` — labeled "Site Source" and described as the Astro/Fuwari source for this blog.

The fork label must remain visible so the page does not imply original ownership of the upstream VulnBot project.

## Component Design

### HomeHero

`src/components/home/HomeHero.astro` renders the personal title, introduction, and two actions over the banner. It is provided to the global layout through an optional `bannerOverlay` named slot. The About action links to `/about/`; the current-activity action links to `/#now`. When the slot is absent, the layout behaves exactly as it does today.

### HomeSidebar

`src/components/home/HomeSidebar.astro` renders the "Now" and "Focus Areas" cards. The existing profile, category, and tag widgets remain responsible for their current data and presentation. The homepage passes this component through an optional `sidebarExtras` named slot instead of duplicating existing widgets.

### FeaturedProjects

`src/components/home/FeaturedProjects.astro` maps the configured project list to three accessible external-link cards. Each card presents its project classification and technology labels. External links open safely with `rel="noopener noreferrer"`.

### RecentTimeline

`src/components/home/RecentTimeline.astro` maps configured timeline entries to a short vertical sequence. Entries are static build-time content and contain a title and one-sentence description.

### Homepage Composition

`src/pages/[...page].astro` remains responsible for pagination. It checks the current page number and renders personal homepage sections only for page 1, followed by the existing `PostPage` and `Pagination` components.

`MainGridLayout.astro` gains the optional `bannerOverlay` and `sidebarExtras` slots plus an `isHomePage` flag. The flag changes mobile grid ordering only on homepage page 1 so the profile and personal sidebar content appear before projects and posts. Defaults preserve all current consumers.

## Data Flow

1. Astro generates the paginated homepage at build time.
2. The homepage reads the static homepage configuration.
3. Page 1 passes the optional hero and sidebar content into `MainGridLayout`.
4. Project and timeline components render configuration arrays at build time.
5. The existing content utilities continue to supply sorted posts to `PostPage`.
6. Later pagination pages skip the personal configuration sections.

There are no client-side requests or loading states for homepage content.

## Responsive Behavior

- Desktop retains the existing two-column Fuwari grid.
- The left sidebar contains profile, current activity, focus areas, categories, and tags.
- The main column contains projects, timeline, and posts.
- Project cards use three columns when space permits.
- Tablet layouts reduce the project grid before content becomes cramped.
- On homepage page 1, the `isHomePage` layout flag changes the mobile grid order to: hero, profile, current activity, focus areas, categories/tags, projects, timeline, posts, footer. Other pages retain the current Fuwari ordering.
- Hero actions wrap instead of overflowing.
- Text remains readable over the banner through a translucent background and sufficient contrast.

## Failure Handling

- Missing optional project technology labels do not prevent rendering.
- Project URLs are ordinary external links; no API failure state is needed.
- Configuration types require project names, descriptions, URLs, and classifications at build time.
- An empty project or timeline list hides its section rather than rendering an empty card.
- Existing image handling remains responsible for the banner and avatar paths.

## Accessibility

- Hero actions and project cards are keyboard-accessible links.
- Section headings follow a logical hierarchy.
- External links have visible labels and safe link attributes.
- The hero panel maintains readable contrast against the banner.
- Information is not conveyed through color alone.
- Mobile tap targets follow the existing Fuwari control sizing.

## Verification

Implementation is accepted when all of the following are true:

- `astro check` completes with zero errors.
- The production build completes successfully and Pagefind still generates its index.
- Page 1 displays hero, homepage sidebar content, projects, timeline, existing posts, and pagination.
- Page 2 and later display the standard article feed without repeated personal sections.
- Archive and article pages retain their current layouts.
- All three project links point to the intended GitHub repositories.
- The VulnBot card visibly identifies the repository as a fork/research project.
- Desktop, tablet, and mobile layouts have no clipping or horizontal overflow.
- Light and dark themes preserve readable text and controls.
