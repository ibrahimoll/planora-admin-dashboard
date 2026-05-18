<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Planora Frontend Style Instructions

Future work in this repo must distinguish between the admin dashboard product interface and any future public landing page or marketing website.

## Admin Dashboard Style

These rules apply to the admin dashboard:

- Keep the dark futuristic AI operations-center style.
- Use Stitch admin dashboard screenshots as the primary reference.
- Use dark backgrounds, cyan/purple accents, glassmorphism, glow, dashboard density, analytics panels, and AI project control visuals.
- Use inspiration from:
  - https://ui-ux-pro-max-skill.nextlevelbuilder.io/
  - https://21st.dev/community/components
  - https://uiverse.io/
  - https://lordicon.com/
- Use those links for inspiration only: micro-interactions, loading effects, buttons, icons, dashboard component polish.
- Do not blindly copy unrelated styles.
- Do not make it childish.
- Keep it professional and aligned with Planora.

## Future Landing Page Style

These rules apply only to the future public landing page / marketing website.
They do NOT apply to the admin dashboard.

Prompt1:
Remove every gradient, glassmorphism effect, and purple-to-blue background from my landing page. Replace with one flat background color and a single accent color.

Prompt2:
Rewrite all copy on my landing page in plain human English.
No "empower," "unleash," "revolutionize," "supercharge," or emoji.
Write like a real person explaining the product to a friend.

Prompt3:
Replace the three-feature-cards-in-a-row section with something that proves the product is real: an actual product screenshot, a short demo clip, or a concrete number/result. No generic icons.

Prompt4:
Pick one real font, not the default, set line-height to 1.5-1.6 for body text, and fix all spacing so sections have consistent vertical rhythm. Remove cramped or uneven padding.

Prompt5:
Audit my entire landing page and remove anything that exists only because it looked cool in a Tailwind demo: floating orbs, fake dashboard mockups, fake testimonials, decorative blurs, and unused animations.

- If a user asks for landing page work, apply Prompt1-Prompt5.
- If a user asks for admin dashboard work, do NOT apply Prompt1-Prompt5. Keep the Stitch dark AI dashboard style.
- If no landing page exists, do not skip these prompts permanently. Keep them saved as future landing-page requirements.
